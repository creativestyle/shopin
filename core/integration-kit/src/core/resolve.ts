import type { Category, Integration, ProviderId } from '../index'
import {
  CATEGORIES,
  asId,
  type ContractExtensions,
  type FeatureModule,
  type Provider,
  type ShopinConfig,
} from './catalog'
import { closest } from './closest'
import { configErrors } from './rules'

/** The shop config as `defineConfig` receives it (its type, `ShopConfig`, is the author entry's). */
type ConfigInput = { readonly [key: string]: unknown } & {
  contracts?: Partial<ContractExtensions>
  features?: readonly FeatureModule[]
}

/** Keys of the shop config that are settings, not categories. */
export const SETTINGS = ['contracts', 'features']

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
 * One integration id, two instances made with different options (`commerce: mock({ mappers })`, `search: mock()`):
 * the config keeps one instance per id, so the other's options (its hooks) would be dropped without a word.
 */
function differentOptions(config: ConfigInput): string[] {
  const first = new Map<
    string,
    { integration: Integration; category: string }
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
      const seen = first.get(integration.id)
      if (!seen) {
        first.set(integration.id, { integration, category })
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
    ...differentOptions(config),
    ...configErrors(resolved),
  ]
  return { resolved, errors }
}

/** A category's integrations, deduplicated by id (one integration may serve several categories). */
export function resolveConfig(config: ConfigInput): ShopinConfig {
  const integrations = new Map<string, Provider>()
  const providers: Partial<Record<Category, ProviderId>> = {}
  const kinds = Object.keys(config).filter((k) =>
    shopKind(config, k)
  ) as Category[]
  const add = (i: Integration) => {
    if (!integrations.has(i.id)) {
      integrations.set(i.id, i as unknown as Provider)
    }
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
    ...(config.features ? { features: config.features } : {}),
  }
}
