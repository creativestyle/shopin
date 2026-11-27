import type { Category, OptionalService } from '@core/integration-kit'
import {
  categoriesOf,
  OPTIONAL_SERVICES,
  storefrontData,
  type LoadedPort,
  type Provider,
} from '@core/integration-kit/core'
import { config as project } from '@shopin/config'
import { currentRequest } from '../common/request-store/request-store'

type ProviderId = Provider['id']

/**
 * A provider id as a key (cookie and vault names, the identity, maps): the text the descriptor declared. A key is
 * never compared to a literal (the import-boundary lint rule refuses it).
 */
export const keyOf = (id: ProviderId): string => id as unknown as string

/** This request's providers: per category the one serving, the ones that cannot (with why), the optional services. */
export interface Serving {
  providers: Partial<Record<Category, ProviderId>>
  unavailable: Partial<Record<Category, string>>
  services: Record<OptionalService, boolean>
}

/** The serving port of each category (not the delegates), set once at boot. */
let serving: { port: LoadedPort; instance: unknown }[] = []

/** Serving ports whose credentials check failed at boot: category → reason. */
const failed: Partial<Record<Category, string>> = {}

/** Delegates that cannot serve (variables missing, credentials check failed): category → id → reason. */
export const unavailableDelegates: Partial<
  Record<Category, Record<string, string>>
> = {}

export function setServing(ports: { port: LoadedPort; instance: unknown }[]) {
  serving = ports
}

export function markFailed(category: Category, reason: string) {
  failed[category] = reason
}

const byId = new Map(project.integrations.map((i) => [i.id, i]))

/** A request's providers and the sign-in rule decided for them (internal: not part of `/bff/capabilities`). */
interface Resolved extends Serving {
  ownSignIn: boolean
}
const perRequest = new WeakMap<object, Resolved>()

/** `ownSignIn` per provider serving both auth and commerce, decided once (the demo switches providers per request). */
const ownSignInByProvider = new Map<ProviderId, boolean>()

/**
 * Whether sign-in is the commerce platform's own (the platform's sign-in over the same platform's commerce): one provider
 * serves auth and commerce (a vendor's parts share one id), and its descriptor requires exactly this commerce
 * (`requires: { auth: { needs: { commerce } } }`). The one rule for the hand-over between sign-in and commerce
 * (D-84): only such a sign-in gets the guest's commerce token, has the commerce session it returns kept, signs in
 * with the customer id as subject, merges the guest cart itself, and has its session end with that commerce session.
 * A sign-in that may only pair with this commerce but is another provider (the mock identity, an outside identity provider limited to one
 * shop) is an identity provider like any other: identity only, linked through the commerce port's `customers`.
 */
function ownSignInOf({ auth, commerce }: Serving['providers']): boolean {
  if (!auth || auth !== commerce) {
    return false
  }
  let own = ownSignInByProvider.get(auth)
  if (own === undefined) {
    const needs = byId.get(auth)?.requires?.auth?.needs.commerce
    own = needs !== undefined && needs === keyOf(commerce)
    ownSignInByProvider.set(auth, own)
  }
  return own
}

function resolve(): Resolved {
  const providers: Serving['providers'] = {}
  const unavailable: Serving['unavailable'] = {}
  // before the ports are built (and without delegates): the configured ones
  for (const category of categoriesOf(project)) {
    if (failed[category]) {
      unavailable[category] = failed[category]
      continue
    }
    const built = serving.find((s) => s.port.category === category)
    const by = built?.port.port.servedBy?.(built.instance as never) ?? {
      id: project.providers[category]!,
    }
    if ('id' in by) {
      providers[category] = by.id as ProviderId
    } else {
      unavailable[category] = by.unavailable
    }
  }
  const commerce = providers.commerce ? byId.get(providers.commerce) : undefined
  const services = Object.fromEntries(
    (Object.keys(OPTIONAL_SERVICES) as OptionalService[]).map((s) => [
      s,
      Boolean(commerce) && !commerce!.omits?.includes(s),
    ])
  ) as Serving['services']
  return { providers, unavailable, services, ownSignIn: ownSignInOf(providers) }
}

/** This request's providers (once per request; at boot, the defaults). */
export function currentProviders(): Resolved {
  let request: object | undefined
  try {
    request = currentRequest()
  } catch {
    return resolve()
  }
  let found = perRequest.get(request)
  if (!found) {
    found = resolve()
    perRequest.set(request, found)
  }
  return found
}

/** Whether this request's sign-in is the commerce platform's own (`ownSignInOf`, decided when its providers were resolved). */
export const isOwnSignIn = (): boolean => currentProviders().ownSignIn

/** The request headers the storefront variants send (CORS); none without variants. */
export const variantHeaders = (): string[] =>
  storefrontData(project).variants.dimensions.map((d) => d.header)
