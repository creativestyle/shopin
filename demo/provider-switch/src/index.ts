import {
  defineIntegration,
  Delegates,
  port,
  RequestContext,
  type Category,
  type Integration,
  type Port,
  type StorefrontVariants,
} from '@core/integration-kit'
import { CommerceSearchProvider } from '@core/contracts/product-search/commerce-search'
import { state, current } from './state'
import {
  COMMERCE_SEARCH,
  integrationsOf,
  providerView,
  reasonIn,
  resolveProviders,
  type CategoryView,
  type Lists,
} from './view'

/** Why a category's default is passed over: its own requirement. */
const reasonOf = (c: CategoryView) =>
  reasonIn(
    c.options.find((o) => o.id === c.defaultProvider)?.requires?.reason ??
      'it does not fit the other defaults'
  )

/** An object that forwards every property read to `target()` at call time (this request's provider). */
function follow<T extends object>(target: () => T): T {
  return new Proxy({} as T, {
    get: (_t, key) => {
      // a port factory's result is awaited at boot (no request then): it is not a promise
      if (key === 'then') {
        return undefined
      }
      const t = target()
      const value = Reflect.get(t, key)
      return typeof value === 'function' ? value.bind(t) : value
    },
  })
}

/** One forwarding object per key of `shape` (a port's services): spreading it at boot keeps it dynamic. */
function followEach<T extends object>(shape: T, target: () => T): T {
  return Object.fromEntries(
    Object.keys(shape).map((key) => [
      key,
      follow(() => target()[key as keyof T] as object),
    ])
  ) as T
}

/** The provider serving `category` for this request, or the 501 that says why none can. */
function serving<C extends Category>(category: C): Port<C> {
  const { providers, unavailable } = current()
  const id = providers[category]
  if (category === 'search' && id === COMMERCE_SEARCH) {
    // this request's commerce provider's own product search, as the BFF serves a shop without a search integration
    return {
      searchService: new CommerceSearchProvider(
        serving('commerce').productSearchService
      ),
    } as Port<C>
  }
  const found = id ? state.delegates[category]?.ports[id] : undefined
  if (found) {
    return found as Port<C>
  }
  // loaded only when a request hits an unavailable category: reading the config never loads Nest
  const { NotImplementedException } =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@nestjs/common') as typeof import('@nestjs/common')
  throw new NotImplementedException(
    `${category} is not available: ${unavailable[category] ?? 'not configured'}`
  )
}

/** One forwarding port for `category` over its delegates' ports. */
function forwarding<C extends Category>(
  category: C,
  ports: readonly object[]
): Port<C> {
  if (category === 'auth') {
    // one getter per member any sign-in port has (Nest probes a port's instance for lifecycle hooks at boot)
    const auth = {}
    for (const key of new Set(ports.flatMap((p) => Object.keys(p)))) {
      Object.defineProperty(auth, key, {
        enumerable: true,
        get: () => (follow(() => serving('auth') as object) as never)[key],
      })
    }
    return auth as Port<C>
  }
  if (category !== 'commerce') {
    return followEach(
      // the members any of its ports has (search through COMMERCE_SEARCH alone loads no port)
      Object.assign(
        category === 'search' ? { searchService: {} } : {},
        ...ports
      ) as object,
      () => serving(category) as object
    ) as Port<C>
  }
  // the services of every commerce port (`…Service`) forward one by one (a service only some offer, the wishlist,
  // too: the BFF asks this request's services before calling it); every other member (customers, guestSession,
  // attachGuestCart, …) is a getter on this request's commerce port, so a new optional member needs no line here
  const isService = (key: string) => key.endsWith('Service')
  const services = Object.fromEntries(
    ports.flatMap((p) => Object.entries(p)).filter(([k]) => isService(k))
  ) as Port<'commerce'>
  const commerce = followEach(services, () => serving('commerce'))
  for (const key of new Set(ports.flatMap((p) => Object.keys(p)))) {
    if (!isService(key)) {
      Object.defineProperty(commerce, key, {
        enumerable: true,
        get() {
          const c = serving('commerce') as unknown as Record<string, unknown>
          const member = c[key]
          return typeof member === 'function' ? member.bind(c) : member
        },
      })
    }
  }
  return commerce as Port<C>
}

/** Every combination of the dimensions' values, and what each serves or falls back to. */
function variants(lists: Lists): StorefrontVariants {
  const view = providerView(lists)
  const dimensions = view
    .filter((c) => c.options.length > 1)
    .map((c) => ({
      name: c.category,
      cookie: c.cookie,
      header: c.header,
      values: c.options.map((o) => o.id),
      default: c.defaultProvider,
    }))
  const combinations: StorefrontVariants['combinations'] = {}
  const walk = (i: number, chosen: Record<string, string>) => {
    if (i === dimensions.length) {
      const key = dimensions.map((d) => chosen[d.name]).join('__')
      const { providers, unavailable } = resolveProviders(view, chosen)
      const to = dimensions
        .map((d) => providers[d.name] ?? d.default)
        .join('__')
      ;(combinations as Record<string, unknown>)[key] =
        to === key ? { providers, unavailable } : { to }
      return
    }
    for (const value of dimensions[i]!.values) {
      walk(i + 1, { ...chosen, [dimensions[i]!.name]: value })
    }
  }
  walk(0, {})
  return { chooser: CHOOSER, dimensions, combinations }
}

/** The way back the storefront's error pages offer when a provider is down: the switcher page /setup (@demo/shop). */
const CHOOSER: StorefrontVariants['chooser'] = {
  path: '/setup',
  hint: {
    en: 'Switch back to sample data in the demo settings; the rest of the demo keeps working.',
    de: 'Wechseln Sie in den Demo-Einstellungen zurück zu den Beispieldaten; der Rest der Demo funktioniert weiter.',
  },
  link: { en: 'Choose other providers', de: 'Andere Anbieter wählen' },
}

/**
 * The demo switcher (BFF and storefront): per category, the integrations to switch between, the first the
 * default. Returns one integration that serves those categories through them (`delegates`): each request picks a
 * provider per category with an `X-<Category>-Provider` header (resolved against the requirements; a missing or
 * ruled-out choice falls back); a category no provider can serve for this request answers 501 with the reason.
 * Its route for the /setup page: `SwitchModule` (`@demo/provider-switch/module`).
 */
export function providerSwitch<const L extends Lists>(
  lists: L
): Integration<'switch', keyof L & Category> {
  const misplaced = Object.entries(lists).flatMap(([category, list]) =>
    category !== 'search' && list?.includes(COMMERCE_SEARCH)
      ? [`${category} lists "${COMMERCE_SEARCH}", which only search offers`]
      : []
  )
  if (misplaced.length) {
    throw new Error(`shopin.config:\n  - ${misplaced.join('\n  - ')}`)
  }
  state.view = providerView(lists)
  const { providers, unavailable } = resolveProviders(state.view, {})
  // the defaults (first of each list) serve together: none is passed over for a later one
  const problems = state.view.flatMap((c) =>
    providers[c.category] === undefined ||
    providers[c.category] === c.defaultProvider
      ? []
      : [
          `${c.category} lists "${c.defaultProvider}" first, but it cannot serve: ${unavailable[c.category] ?? reasonOf(c)}`,
        ]
  )
  if (problems.length) {
    throw new Error(`shopin.config:\n  - ${problems.join('\n  - ')}`)
  }
  const categories = Object.keys(lists) as (keyof L & Category)[]
  // by instance, not by id: a vendor's parts (commercetools commerce and auth) share the id and the kit merges them
  const delegates = [
    ...new Set(Object.values(lists).flatMap(integrationsOf)),
  ] as Integration[]
  return defineIntegration({
    id: 'switch',
    label: 'Provider switch (demo)',
    description: 'Each visitor chooses the provider per category',
    delegates,
    storefront: { variants: variants(lists) },
    ports: Object.fromEntries(
      categories.map((category) => [
        category,
        () =>
          port(category, {
            inject: [Delegates, RequestContext],
            useFactory: (given: Delegates, context: RequestContext) => {
              state.delegates[category] = given
              state.context = context
              return forwarding(
                category,
                Object.values(given.ports) as object[]
              )
            },
            servedBy: () => {
              const now = current()
              const id = now.providers[category]
              return id
                ? { id }
                : { unavailable: now.unavailable[category] ?? 'not configured' }
            },
          }),
      ])
    ) as unknown as Integration<'switch', keyof L & Category>['ports'],
  })
}
