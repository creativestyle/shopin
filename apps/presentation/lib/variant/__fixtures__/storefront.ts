/**
 * The shop config the storefront tests run against, built from fixture integrations with the integration
 * kit (no integration package, no `@shopin/config`): every storefront test passes whatever
 * config/shop/shopin.config.ts says. jest.config.ts maps `@shopin/storefront/storefront-data.json` to
 * `FIXTURE_STOREFRONT` (lib/__fixtures__/storefront-data.ts), where the storefront imports the real one.
 *
 * Shape: a router that serves through others (the kit's `delegates`) and declares the storefront's variants:
 * two commerce platforms, three search providers (one only works with its own commerce), two cms, two sign-ins
 * that each pair with one commerce platform; one psp served directly; product images resized by filename suffix.
 *
 * Imported by jest.config.ts: package and relative imports only (no `@/` alias).
 */
import {
  defineConfig,
  defineIntegration,
  port,
  type Category,
  type Integration,
  type Requirement,
} from '@core/integration-kit'
import { storefrontData, type StorefrontData } from '@core/integration-kit/core'

/** A port the storefront never loads (only the BFF does): building one is a test error. */
const noPort = <C extends Category>(category: C) =>
  port(category, {
    useFactory: () => {
      throw new Error(
        `fixture ${category} port: the storefront never loads a port`
      )
    },
  })

function fixture<C extends Category>(
  id: string,
  serves: C[],
  extra: Partial<Pick<Integration, 'label' | 'storefront'>> & {
    requires?: Partial<Record<C, Requirement>>
  } = {}
) {
  return defineIntegration({
    id,
    // every descriptor names itself and says what it does; a fixture without a label is named by its id
    label: id,
    description: `The ${id} fixture`,
    ...extra,
    ports: Object.fromEntries(
      serves.map((c) => [c, () => noPort(c)])
    ) as unknown as Integration<string, C>['ports'],
  })
}

const needs = (commerce: string, reason: string): Requirement => ({
  needs: { commerce },
  reason,
})

export const remote = fixture('remote', ['commerce', 'search', 'auth'], {
  label: 'Remote platform',
  requires: {
    search: needs('remote', 'Remote search reads the remote catalog'),
    auth: needs('remote', 'Remote sign-in uses the remote customers'),
  },
  storefront: {
    productImages: {
      hosts: ['images.eu.platform.example'],
      resize: {
        kind: 'suffix',
        steps: [
          { maxWidth: 50, suffix: '-thumb' },
          { maxWidth: 150, suffix: '-small' },
          { maxWidth: 400, suffix: '-medium' },
          { maxWidth: 700, suffix: '-large' },
        ],
        largest: '-zoom',
      },
    },
  },
})
export const local = fixture('local', ['commerce', 'search', 'cms', 'psp'], {
  label: 'In-memory',
})
export const finder = fixture('finder', ['search'], { label: 'Finder search' })
export const headless = fixture('headless', ['cms'], {
  label: 'Headless CMS',
  storefront: {
    contentImages: {
      hosts: ['images.headless.invalid'],
      resize: { kind: 'query', width: 'w', quality: 'q' },
    },
    previewOrigins: ['https://editor.headless.invalid'],
  },
})
export const localIdp = fixture('local-idp', ['auth'], {
  label: 'Local sign-in',
  requires: {
    auth: needs('local', 'Local sign-in signs in local customers only'),
  },
})

type Lists = Partial<Record<Category, readonly Integration<string, any>[]>>

/**
 * The variants a router over `lists` declares: one dimension per category with a choice; per combination, the
 * chosen provider when its requirements hold, else the first that fits (a combination that changes falls back).
 */
export function variantsOf(lists: Lists) {
  const view = Object.entries(lists) as [Category, readonly Integration[]][]
  const resolve = (chosen: Record<string, string>) => {
    const providers: Record<string, string> = {}
    const unavailable: Record<string, string> = {}
    for (const [category, list] of view) {
      const wanted = list.find((i) => i.id === chosen[category])
      const ordered = wanted
        ? [wanted, ...list.filter((i) => i !== wanted)]
        : list
      const fits = (i: Integration) =>
        Object.entries(i.requires?.[category]?.needs ?? {}).every(
          ([c, p]) => providers[c] === p
        )
      const pick = ordered.find(fits)
      if (pick) {
        providers[category] = pick.id
      } else {
        const reason = (wanted ?? list[0])?.requires?.[category]?.reason
        unavailable[category] = typeof reason === 'string' ? reason : 'none'
      }
    }
    return { providers, unavailable }
  }
  const dimensions = view
    .filter(([, list]) => list.length > 1)
    .map(([name, list]) => ({
      name,
      cookie: `shopin-${name}`,
      header: `X-${name[0]!.toUpperCase()}${name.slice(1)}-Provider`,
      values: list.map((i) => i.id),
      default: list[0]!.id,
    }))
  const combinations: Record<string, unknown> = {}
  let combos: Record<string, string>[] = [{}]
  for (const d of dimensions) {
    combos = combos.flatMap((c) => d.values.map((v) => ({ ...c, [d.name]: v })))
  }
  for (const chosen of combos) {
    const key = dimensions.map((d) => chosen[d.name]).join('__')
    const resolved = resolve(chosen)
    const to = dimensions
      .map((d) => resolved.providers[d.name] ?? d.default)
      .join('__')
    combinations[key] = to === key ? resolved : { to }
  }
  return { chooser: CHOOSER, dimensions, combinations } as NonNullable<
    NonNullable<Integration['storefront']>['variants']
  >
}

/** Where the router lets the visitor choose another variant (the error pages link to it when a provider is down). */
export const CHOOSER = {
  path: '/choose',
  hint: {
    en: 'Choose another provider for it.',
    de: 'Wählen Sie dafür einen anderen Anbieter.',
  },
  link: { en: 'Other providers', de: 'Andere Anbieter' },
}

/** An integration that serves `lists` through their integrations, with their variants. */
export function router<const L extends Lists>(lists: L) {
  const delegates = [...new Set(Object.values(lists).flat())] as Integration[]
  return defineIntegration({
    id: 'router',
    label: 'Router',
    description: 'Serves each request through the chosen fixture',
    delegates,
    storefront: { variants: variantsOf(lists) },
    ports: Object.fromEntries(
      Object.keys(lists).map((c) => [c, () => noPort(c)])
    ) as unknown as Integration<string, keyof L & Category>['ports'],
  })
}

export const FIXTURE_LISTS = {
  commerce: [remote, local],
  search: [remote, finder, local],
  cms: [headless, local],
  auth: [remote, localIdp],
} as const

const routed = router(FIXTURE_LISTS)

export const FIXTURE_CONFIG = defineConfig({
  commerce: routed,
  search: routed,
  cms: routed,
  psp: local,
  auth: routed,
})

export const FIXTURE_STOREFRONT: StorefrontData = storefrontData(FIXTURE_CONFIG)
