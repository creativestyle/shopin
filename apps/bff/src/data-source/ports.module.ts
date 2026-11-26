import { Logger, Module, type DynamicModule, type Type } from '@nestjs/common'
import {
  CustomerContext,
  Delegates,
  PortOptions,
  RequestContext,
  ServingPorts,
  TokenVault,
  type Category,
  type OptionalService,
} from '@core/integration-kit'
import {
  CATEGORIES,
  categoriesOf,
  loadPorts,
  OPTIONAL_SERVICES,
  readsOf,
  type LoadedPort,
} from '@core/integration-kit/core'
import type { AllServices } from '@core/contracts/core/data-source-interfaces'
import { I18N_CONFIG } from '@config/constants'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { config as project } from '@shopin/config'
import { linkedCustomerOf } from '../common/session/session.service'
import { VaultService } from '../common/vault/vault.service'
import { TokenEncryptionService } from '../common/token-management/token-encryption.service'
import { currentRequest } from '../common/request-store/request-store'
import { frontendUrl, partEnv, partEnvNames } from '../common/env/env-file'
import {
  currentProviders,
  keyOf,
  markFailed,
  setServing,
  unavailableDelegates,
} from './providers'
import { GUARDS_METADATA } from '@nestjs/common/constants'
import { CsrfOnWritesGuard } from '../features/csrf/csrf.guard'
import { CommerceSearchProvider } from './commerce-search.provider'

/**
 * Injectable: the serving port per category (commerce always; the others and the shop's own kinds when
 * configured). The kit's `ServingPorts`, the one token features, shop features and ports read.
 */
export { ServingPorts as Ports }

/** Injectable: the services of the serving ports, one object built at boot (what features call). */
export abstract class Services implements Omit<AllServices, 'wishlistService'> {
  abstract readonly productService: AllServices['productService']
  abstract readonly productCollectionService: AllServices['productCollectionService']
  abstract readonly productSearchService: AllServices['productSearchService']
  abstract readonly navigationService: AllServices['navigationService']
  abstract readonly cartService: AllServices['cartService']
  abstract readonly cartPaymentService: AllServices['cartPaymentService']
  abstract readonly storeConfigService: AllServices['storeConfigService']
  abstract readonly paymentService: AllServices['paymentService']
  abstract readonly customerService: AllServices['customerService']
  abstract readonly customerAddressService: AllServices['customerAddressService']
  abstract readonly orderService: AllServices['orderService']
  /** Undefined when no commerce provider offers wishlists; ask `currentProviders().services.wishlist` first. */
  abstract readonly wishlistService: AllServices['wishlistService'] | undefined
  abstract readonly pageService: AllServices['pageService']
  abstract readonly layoutService: AllServices['layoutService']
  abstract readonly searchService: AllServices['searchService']
}

let loaded: LoadedPort[] = []

/** The ports this BFF runs (category and provider), for diagnostics and tests. */
export const loadedPorts = (): readonly LoadedPort[] => loaded

/** The categories at least one configured provider serves (SHOPin's and the shop's own kinds). */
const SERVED = new Set(categoriesOf(project))

/** Every category and kind a port may read: SHOPin's five and the configured shop kinds. */
const KNOWN = new Set<string>([...CATEGORIES, ...categoriesOf(project)])

/**
 * The controllers of a feature module and of every module it imports, at any depth (a static import or a dynamic
 * module's `module`, `controllers` and `imports`): what the CSRF guard and the `@Reads` check must see.
 */
function controllersOf(module: unknown, seen = new Set<unknown>()): Type[] {
  const dynamic = module as Partial<DynamicModule> | undefined
  const type = (dynamic?.module ?? module) as Type | undefined
  if (!type || seen.has(module)) {
    return []
  }
  seen.add(module)
  const meta = (key: string) =>
    (Reflect.getMetadata(key, type) ?? []) as unknown[]
  return [
    ...(meta('controllers') as Type[]),
    ...((dynamic?.module ? dynamic.controllers : []) ?? []),
    ...[...meta('imports'), ...((dynamic?.module ? dynamic.imports : []) ?? [])]
      // forwardRef(() => X) as Nest takes it
      .map((i) => (i as { forwardRef?: () => unknown })?.forwardRef?.() ?? i)
      .flatMap((i) => controllersOf(i, seen)),
  ]
}

/**
 * The shop's own BFF feature modules (`features` in shopin.config.ts). Every route of theirs that changes state
 * (not GET, HEAD, OPTIONS) needs the CSRF token, as SHOPin's own do, in the listed modules and in every module
 * they import: the shop writes no guard and cannot leave it out.
 */
export const shopFeatures = (): Type[] => {
  const modules = (project.features ?? []) as unknown as Type[]
  for (const controller of modules.flatMap((m) => controllersOf(m))) {
    const guards = (Reflect.getMetadata(GUARDS_METADATA, controller) ??
      []) as unknown[]
    if (!guards.includes(CsrfOnWritesGuard)) {
      Reflect.defineMetadata(
        GUARDS_METADATA,
        [CsrfOnWritesGuard, ...guards],
        controller
      )
    }
  }
  return modules
}

/**
 * Feature modules to mount: those whose controllers' categories (`@Reads`), in the module and every module it
 * imports, are all served. Refuses to boot when a controller does not declare `@Reads`.
 */
export function mountable(modules: Type[]): Type[] {
  const undeclared: string[] = []
  const mounted = modules.filter((m) =>
    controllersOf(m).every((controller) => {
      const categories = readsOf(controller)
      if (!categories) {
        undeclared.push(controller.name)
      }
      return (categories ?? []).every((c) => SERVED.has(c))
    })
  )
  if (undeclared.length) {
    throw new Error(
      `BFF: controllers without @Reads(...) (from @core/integration-kit): ${undeclared.join(', ')}`
    )
  }
  return mounted
}

/** RequestContext: a singleton accessor of the request in progress. */
const requestContext = (): RequestContext => ({
  get language() {
    return (currentRequest().language as string) || I18N_CONFIG.defaultLocale
  },
  get currency() {
    return resolveCurrencyFromLanguage(this.language)
  },
  header(name: string) {
    const value = currentRequest().headers[name.toLowerCase()]
    return Array.isArray(value) ? value[0] : value
  },
  get storefrontUrl() {
    return frontendUrl()
  },
  getCurrentLanguage() {
    return this.language
  },
  locales: I18N_CONFIG.supportedLocales,
})

let serving: ServingPorts | undefined

/**
 * ServingPorts as a port sees it: the same ports, read when the port serves a request. A port is built
 * before the others are, so it may not read them while the BFF starts (an enricher of commerce reads the
 * shop's `orderRules` port per cart).
 */
const servingLater = new Proxy({} as ServingPorts, {
  get(_, key) {
    if (!serving && typeof key === 'string' && KNOWN.has(key)) {
      throw new Error(
        `ServingPorts.${key} was read while the BFF starts: a port reads other ports only when it serves a request`
      )
    }
    return (
      serving as unknown as Record<string | symbol, unknown> | undefined
    )?.[key]
  },
})

/** Fresh Nest module class per port, so two ports never share a module instance. */
const portModule = (name: string) =>
  Object.defineProperty(class {}, 'name', { value: name }) as Type

/**
 * The Nest module around one port: the integration's providers, its options, its own vault entry, the
 * customer it acts for. RequestContext is global (an integration's own sub-modules read it too).
 */
function portModuleOf(
  { port, options, category, id }: LoadedPort,
  token: symbol,
  delegates: { module: DynamicModule; token: symbol; id: string }[] = []
): DynamicModule {
  const vault = (enc: TokenEncryptionService) => () =>
    VaultService.forRequest(currentRequest(), enc).forPart(category, keyOf(id))
  return {
    module: portModule(`${id}:${category}`),
    imports: [
      ...((port.imports ?? []) as DynamicModule[]),
      ...delegates.map((d) => d.module),
    ],
    providers: [
      {
        provide: Delegates,
        inject: delegates.map((d) => d.token),
        useFactory: (...instances: unknown[]): Delegates => ({
          ports: Object.fromEntries(
            delegates.map((d, i) => [d.id, instances[i]])
          ),
          unavailable: (unavailableDelegates[category] ??= {}),
        }),
      },
      ...((port.providers ?? []) as Type[]),
      { provide: PortOptions, useValue: Object.freeze({ ...options }) },
      { provide: ServingPorts, useValue: servingLater },
      {
        provide: TokenVault,
        inject: [TokenEncryptionService],
        useFactory: (enc: TokenEncryptionService): TokenVault => {
          const v = vault(enc)
          return {
            get: () => v().get(),
            set: (t, c) => v().set(t, c),
            clear: () => v().clear(),
          }
        },
      },
      {
        provide: CustomerContext,
        inject: [TokenEncryptionService],
        useFactory: (enc: TokenEncryptionService): CustomerContext => ({
          customerId: () => linkedCustomerOf(currentRequest(), enc, keyOf(id)),
        }),
      },
      {
        provide: token,
        inject: (port.inject ?? []) as Type[],
        useFactory: port.useFactory,
      },
    ],
    exports: [token],
  }
}

/**
 * Every loaded commerce port leaves out exactly the optional services its descriptor lists in `omits`: the
 * storefront hides what the descriptor names, the BFF answers 501 for it, so the two must agree.
 */
function assertOmits(all: Record<string, Record<string, unknown>>): void {
  const errors = Object.entries(all.commerce ?? {}).flatMap(([id, port]) => {
    const omits =
      project.integrations.find((i) => keyOf(i.id) === id)?.omits ?? []
    return (Object.keys(OPTIONAL_SERVICES) as OptionalService[]).flatMap(
      (service) => {
        const member = OPTIONAL_SERVICES[service]
        const missing = (port as Record<string, unknown>)[member] === undefined
        if (missing === omits.includes(service)) {
          return []
        }
        return missing
          ? [`"${id}" has no ${member}: list '${service}' in its omits`]
          : [`"${id}" lists '${service}' in omits but has a ${member}`]
      }
    )
  })
  if (errors.length) {
    throw new Error(`shopin.config: ${errors.join('; ')}`)
  }
}

const logger = new Logger('Providers')

/** How long one credentials check may take at boot. */
const PROBE_MS = 5000

/**
 * Each port's own credentials check (`probe` on its definition), once, in parallel, at boot: a failure marks the
 * provider unavailable with the reason (a delegate: for the integration serving through it). One rule for every
 * category and vendor: the BFF starts, `/bff/capabilities` names the reason, the storefront shows the category as
 * not available.
 */
async function probe(instances: unknown[]): Promise<void> {
  // each port's check judges its own category (a vendor's parts check different things: commerce its credentials,
  // sign-in its scopes); a port without a check of its own follows any failed check of the same instance
  const instance = (via: unknown, id: unknown) =>
    `${via ? keyOf(via as never) : ''}>${keyOf(id as never)}`
  const failed = new Map<string, string>()
  const failedCategory = new Map<string, string>()
  await Promise.all(
    loaded.map(async ({ port, id, via }, i) => {
      if (!port.probe) {
        return
      }
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([
          port.probe(instances[i] as never, loaded[i]!.options),
          new Promise((_, reject) => {
            timer = setTimeout(
              () => reject(new Error(`no answer within ${PROBE_MS / 1000} s`)),
              PROBE_MS
            )
          }),
        ])
      } catch (error) {
        const reason = `its credentials check failed (${(error as Error)?.message ?? String(error)})`
        failed.set(instance(via, id), reason)
        failedCategory.set(
          `${instance(via, id)}|${loaded[i]!.category}`,
          reason
        )
      } finally {
        clearTimeout(timer)
      }
    })
  )
  for (const { category, id, via, port } of loaded) {
    const reason = port.probe
      ? failedCategory.get(`${instance(via, id)}|${category}`)
      : failed.get(instance(via, id))
    if (!reason) {
      continue
    }
    if (via) {
      ;(unavailableDelegates[category] ??= {})[keyOf(id)] = reason
    } else {
      markFailed(category, reason)
      logger.warn(`"${keyOf(id)}" (${category}) is unavailable: ${reason}`)
    }
  }
}

/** Sign-in through another integration's auth port needs a commerce port that supplies `customers`. */
function assertLinkable(ports: ServingPorts): void {
  const through = (c: Category) =>
    loaded.some((p) => p.category === c && !p.via && p.port.servedBy)
  if (!ports.auth || through('auth') || through('commerce')) {
    return
  }
  const { providers } = currentProviders()
  // a sign-in or commerce provider whose credentials check failed is unavailable: nothing to link
  if (!providers.auth || !providers.commerce) {
    return
  }
  const auth = providers.auth
  const native = project.integrations.find((i) => i.id === auth)?.requires?.auth
    ?.needs.commerce
  if (!native && !ports.commerce.customers) {
    throw new Error(
      `shopin.config: sign-in through "${auth}" needs the commerce integration to link customer accounts, and "${providers.commerce}" does not (its README says whether a setting allows it)`
    )
  }
}

/**
 * Loads the serving ports at boot: reads each port's declared variables (and nothing else), hands them
 * over as `PortOptions`, and builds `Ports` and `Services` once. An integration that serves through others
 * (`delegates`) gets their ports, each loaded with its own options, vault and customer, as `Delegates`.
 */
@Module({})
export class PortsModule {
  static forRoot(
    env: (name: string) => string | undefined = partEnv
  ): DynamicModule {
    const found = loadPorts(project, {
      get: env,
      locales: I18N_CONFIG.supportedLocales,
      present: env === partEnv ? partEnvNames() : [],
      // `{BFF_URL}` in a variable's value or default: this BFF's public URL
      bffUrl:
        process.env.BFF_URL?.trim() ||
        `http://localhost:${process.env.PORT ?? 4000}/bff`,
    })
    loaded = found.ports
    for (const { category, id, reason } of found.unavailable) {
      ;(unavailableDelegates[category] ??= {})[keyOf(id)] = reason
    }
    const tokens = loaded.map((p) => Symbol(`${p.id} ${p.category} port`))
    // a delegate's module is imported by the module of the port serving through it
    const modules: DynamicModule[] = []
    loaded.forEach((p, i) => {
      const delegates = loaded.flatMap((d, k) =>
        d.via === p.id && d.category === p.category && !p.via
          ? [{ module: modules[k]!, token: tokens[k]!, id: keyOf(d.id) }]
          : []
      )
      modules[i] = portModuleOf(p, tokens[i]!, delegates)
    })
    const byId = (instances: unknown[]) => {
      const all: Record<string, Record<string, unknown>> = {}
      loaded.forEach(
        ({ category, id }, i) =>
          ((all[category] ??= {})[keyOf(id)] = instances[i])
      )
      return all
    }
    const ports = async (...instances: unknown[]): Promise<ServingPorts> => {
      setServing(
        loaded.flatMap((port, i) =>
          port.via ? [] : [{ port, instance: instances[i] }]
        )
      )
      await probe(instances)
      assertOmits(byId(instances))
      const chosen = Object.fromEntries(
        loaded.flatMap((p, i) => (p.via ? [] : [[p.category, instances[i]]]))
      ) as unknown as ServingPorts
      assertLinkable(chosen)
      return (serving = chosen)
    }
    return {
      module: PortsModule,
      global: true,
      imports: modules,
      providers: [
        { provide: RequestContext, useFactory: requestContext },
        { provide: ServingPorts, inject: tokens, useFactory: ports },
        {
          provide: Services,
          inject: [ServingPorts],
          useFactory: (p: ServingPorts): Services => {
            // copy the services (`…Service`) by key without reading the other members: a port that serves
            // through delegates has getters bound to the request in progress, and there is none at boot
            const commerce = Object.fromEntries(
              Object.keys(p.commerce)
                .filter((k) => k.endsWith('Service'))
                .map((k) => [
                  k,
                  p.commerce[k as keyof ServingPorts['commerce']],
                ])
            )
            return {
              ...commerce,
              ...p.cms,
              ...p.psp,
              // no search integration configured: the commerce integration's own product search serves it
              searchService:
                p.search?.searchService ??
                new CommerceSearchProvider(p.commerce.productSearchService),
            } as Services
          },
        },
      ],
      exports: [RequestContext, ServingPorts, Services],
    }
  }
}
