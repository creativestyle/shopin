import type { Category, Integration, ProviderId } from '../index'
import {
  CATEGORIES,
  asId,
  type ContractExtensions,
  type FeatureModule,
  type Provider,
  type ShopinConfig,
} from './catalog'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import { closest } from './closest'
import { configErrors } from './rules'

/** The shop config as `defineConfig` receives it (its type, `ShopConfig`, is the author entry's). */
type ConfigInput = { readonly [key: string]: unknown } & {
  contracts?: Partial<ContractExtensions>
  cartFields?: readonly string[]
  features?: readonly FeatureModule[]
}

/** Keys of the shop config that are settings, not categories. */
export const SETTINGS = ['contracts', 'cartFields', 'features']

/** The contracts a shop may extend (keys of `ContractExtensions`). */
const CONTRACTS = ['cart', 'productCard', 'product']

const isIntegration = (v: unknown): v is Integration =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Integration).id === 'string' &&
  typeof (v as Integration).ports === 'object'

/** A key of the shop config that is a shop's own kind of port: every integration under it provides that kind. */
function shopKind(config: ConfigInput, key: string): boolean {
  if (
    (CATEGORIES as readonly string[]).includes(key) ||
    SETTINGS.includes(key)
  ) {
    return false
  }
  const value = (config as unknown as Record<string, unknown>)[key]
  return isIntegration(value) && key in value.ports
}

/**
 * One integration id, two instances made with different options (`commerce: mock({ mappers })`, `cms: mock()`):
 * the config keeps one instance per id, so the other's options (its hooks) would be dropped without a word. Two
 * parts of one vendor (`integrations/<vendor>/<category>`: the same id, no category in common) are one provider,
 * not two instances: they are merged (`mergeParts`), so only instances serving a category in common are compared.
 */
function differentOptions(config: ConfigInput): string[] {
  const first = new Map<
    string,
    { integration: Integration; category: string }[]
  >()
  const errors: string[] = []
  for (const [category, value] of Object.entries(config)) {
    if (SETTINGS.includes(category)) {
      continue
    }
    if (!isIntegration(value)) {
      continue
    }
    for (const integration of withDelegates(value)) {
      const parts = first.get(integration.id) ?? []
      const seen = parts.find((p) => sharesPorts(p.integration, integration))
      if (!seen) {
        first.set(integration.id, [...parts, { integration, category }])
      } else if (!sameOptions(seen.integration, integration)) {
        errors.push(
          `"${integration.id}" is given different options under ${seen.category} and ${category}: SHOPin keeps one instance per integration. Create it once (const shop = ${integration.id}({ … })) and use that for both`
        )
      }
    }
  }
  return errors
}

/** An integration and its delegates at every depth, as `resolveConfig` registers them. */
function withDelegates(
  integration: Integration,
  seen = new Set<Integration>()
): Integration[] {
  if (seen.has(integration)) {
    return []
  }
  seen.add(integration)
  return [
    integration,
    ...(integration.delegates ?? [])
      .filter(isIntegration)
      .flatMap((d) => withDelegates(d, seen)),
  ]
}

/** Two instances of one id that serve a category in common (one part twice), not two parts of a vendor. */
const sharesPorts = (a: Integration, b: Integration) =>
  a === b || Object.keys(a.ports).some((c) => c in b.ports)

/**
 * A vendor's parts as one provider: the ports, variables, requirements and storefront slots of each part, the
 * first part's label and options (`omits`, `mappers`) where a later part has none. A part serves only its own
 * category, so nothing of one part replaces another's.
 */
export function mergeParts(a: Integration, b: Integration): Integration {
  if (a === b || sharesPorts(a, b)) {
    return a
  }
  const defined = <T extends object>(o: T): T =>
    Object.fromEntries(
      Object.entries(o).filter(([, v]) => v !== undefined)
    ) as T
  const sa = a.storefront ?? {}
  const sb = b.storefront ?? {}
  const storefront = defined({
    productImages: sa.productImages ?? sb.productImages,
    contentImages: sa.contentImages ?? sb.contentImages,
    slots: sa.slots || sb.slots ? { ...sa.slots, ...sb.slots } : undefined,
    variants: sa.variants ?? sb.variants,
  })
  return defined({
    ...a,
    label: a.label ?? b.label,
    ports: { ...a.ports, ...b.ports },
    env: a.env || b.env ? { ...a.env, ...b.env } : undefined,
    requires:
      a.requires || b.requires ? { ...a.requires, ...b.requires } : undefined,
    omits: a.omits ?? b.omits,
    mappers: a.mappers ?? b.mappers,
    delegates:
      a.delegates || b.delegates
        ? [...(a.delegates ?? []), ...(b.delegates ?? [])]
        : undefined,
    storefront: Object.keys(storefront).length ? storefront : undefined,
  }) as Integration
}

/** Same options: equal descriptors (values compared deeply, functions by identity), ports by category. */
function sameOptions(a: Integration, b: Integration): boolean {
  if (a === b) {
    return true
  }
  const { ports: portsA, env: envA, ...restA } = a
  const { ports: portsB, env: envB, ...restB } = b
  // a variable's `requiredWhen` is made per call, like the port loaders: compared by the variables it guards
  const names = (env: Integration['env']) =>
    JSON.stringify(env ?? {}, (k, v) => (k === 'requiredWhen' ? undefined : v))
  return (
    equal(Object.keys(portsA).sort(), Object.keys(portsB).sort()) &&
    names(envA) === names(envB) &&
    equal(restA, restB)
  )
}

function equal(x: unknown, y: unknown): boolean {
  if (x === y) {
    return true
  }
  if (typeof x !== 'object' || typeof y !== 'object' || !x || !y) {
    return false
  }
  if (Array.isArray(x) !== Array.isArray(y)) {
    return false
  }
  const keys = (o: object) =>
    Object.keys(o).filter(
      (k) => (o as Record<string, unknown>)[k] !== undefined
    )
  const kx = keys(x)
  return (
    kx.length === keys(y).length &&
    kx.every((k) =>
      equal(
        (x as Record<string, unknown>)[k],
        (y as Record<string, unknown>)[k]
      )
    )
  )
}

/**
 * What `defineConfig` checks: every problem of the shop config (unknown keys, contracts, features, options, the
 * resolved config's rules) and the resolved config.
 */
export function validateConfig(config: ConfigInput): {
  resolved: ShopinConfig
  errors: string[]
} {
  const resolved = resolveConfig(config)
  const errors = [
    ...Object.keys(config)
      .filter(
        (k) =>
          !(CATEGORIES as readonly string[]).includes(k) &&
          !SETTINGS.includes(k) &&
          !shopKind(config, k)
      )
      .map((k) => {
        const near = closest(k, [...CATEGORIES, ...SETTINGS])
        return `unknown key "${k}"${near ? ` (did you mean "${near}"?)` : ''} (categories: ${CATEGORIES.join(', ')}, or a kind of port the integration under it provides)`
      }),
    ...Object.entries(config.contracts ?? {})
      .filter(
        ([k, v]) =>
          !CONTRACTS.includes(k) ||
          typeof (v as { parse?: unknown })?.parse !== 'function'
      )
      .map(
        ([k]) =>
          `contracts.${k}: not a schema of an extendable contract (${CONTRACTS.join(', ')})`
      ),
    ...Object.entries(config)
      .filter(([k, v]) => !SETTINGS.includes(k) && Array.isArray(v))
      .map(
        ([k]) =>
          `${k} lists several integrations: one serves a category (an integration that serves through others names them in its delegates)`
      ),
    ...(config.features ?? []).flatMap((f, i) =>
      typeof f === 'function' ? [] : [`features[${i}]: not a Nest module class`]
    ),
    // a writable cart field must be one the shop's cart contract has (a typo would silently stay read-only)
    ...(config.cartFields ?? []).flatMap((name) => {
      const shape =
        (config.contracts?.cart as { shape?: Record<string, unknown> })
          ?.shape ?? {}
      if (Object.hasOwn(CartResponseSchema.shape, name)) {
        return [
          `cartFields: "${name}" is SHOPin's own cart field, never writable through the shop's cart fields`,
        ]
      }
      return Object.hasOwn(shape, name)
        ? []
        : [
            `cartFields: "${name}" is not a field of contracts.cart (list only fields your cart contract adds)`,
          ]
    }),
    ...differentOptions(config),
    ...configErrors(resolved),
  ]
  return { resolved, errors }
}

/**
 * A category's integrations, deduplicated by id (one integration may serve several categories; a vendor's parts,
 * one package per category, are merged into one provider of that id).
 */
export function resolveConfig(config: ConfigInput): ShopinConfig {
  const integrations = new Map<string, Provider>()
  const providers: Partial<Record<Category, ProviderId>> = {}
  const kinds = Object.keys(config).filter((k) =>
    shopKind(config, k)
  ) as Category[]
  const add = (i: Integration) => {
    const known = integrations.get(i.id) as unknown as Integration | undefined
    // a vendor's other part (same id, another category) joins its provider
    integrations.set(
      i.id,
      (known ? mergeParts(known, i) : i) as unknown as Provider
    )
    for (const d of i.delegates ?? []) {
      add(d)
    }
    return asId(i.id)
  }
  for (const category of [...CATEGORIES, ...kinds]) {
    const value = (config as unknown as Record<string, unknown>)[category]
    if (!isIntegration(value)) {
      continue
    }
    providers[category] = add(value)
  }
  return {
    integrations: [...integrations.values()],
    providers,
    ...(config.contracts ? { contracts: config.contracts } : {}),
    ...(config.cartFields ? { cartFields: config.cartFields } : {}),
    ...(config.features ? { features: config.features } : {}),
  }
}
