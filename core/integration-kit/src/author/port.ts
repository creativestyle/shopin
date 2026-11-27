import type { Category } from './categories'
import type { Port } from './port-types'
import type { EnvSchema } from './descriptor'

/**
 * What one of the platform's errors means, decided by the integration (`errors` on its port): the status the shopper
 * gets and, optionally, a fixed message (never the platform's own text). 400 for an error the request caused (a page
 * beyond the searchable range), 401 for an expired shopper token (the BFF renews it), 403 refused, 404 not found,
 * 409 changed meanwhile, 502 the platform failed or refused the API client, 503 unavailable, 504 timed out.
 */
export interface PortError {
  status: 400 | 401 | 403 | 404 | 409 | 502 | 503 | 504
  message?: string
}

/**
 * A port of an integration: the Nest providers it needs and the factory that returns its `Port<C>`.
 * The same fields as a Nest factory provider (`providers`, `imports`, `inject`, `useFactory`).
 */
export interface PortDefinition<C extends Category = Category> {
  category: C
  imports?: unknown[]
  providers?: unknown[]
  inject?: unknown[]
  useFactory: (...deps: never[]) => Port<C> | Promise<Port<C>>
  /**
   * Optional: checks the credentials once while the BFF starts (one cheap call, e.g. a token request) and throws
   * when they do not work. The provider is then unavailable, with the error's message as the reason, in
   * `/bff/capabilities` and to an integration serving through it; the BFF starts all the same (a category nobody
   * can serve shows the storefront's "not available" page).
   */
  probe?: (port: Port<C>, options: PortOptions) => Promise<void>
  /**
   * Optional: turns this platform's errors into what they mean (`PortError`); `undefined` keeps an error as it is
   * (the BFF answers 500 for a bug, 502-504 for a network failure). The BFF applies it to the port's services
   * (`…Service` members) and its other methods; sign-in flows (the `auth` port, `guestSession`, `customers`) keep
   * their own errors, which the session check and the token refresh read.
   */
  errors?: (error: unknown) => PortError | undefined
  /**
   * Only for a port of an integration that serves through others (`delegates`): which of them serves the request
   * in progress (the BFF keys the shopper's tokens, customer link and sign-in by it), or why none can.
   */
  servedBy?: (port: Port<C>) => { id: string } | { unavailable: string }
}

/**
 * Declares an integration's port for one category. The BFF builds the Nest module around it, injects
 * `PortOptions` (the variables the descriptor declares) and loads it only when shopin.config.ts chooses it.
 */
export function port<C extends Category>(
  category: C,
  definition: Omit<PortDefinition<C>, 'category'>
): PortDefinition<C> {
  return { category, ...definition }
}

/**
 * The port's options: the variables its descriptor declares under `env`, read by the BFF (a port never
 * reads `process.env`). Inject it like any provider; type it with `PortOptions.Of<typeof yourEnv>`.
 */
export abstract class PortOptions {
  readonly [option: string]: string | undefined
}
// A class and a namespace of one name merge (TypeScript declaration merging): PortOptions.Of<...> types the options.
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export declare namespace PortOptions {
  type Of<S extends EnvSchema> = {
    [K in keyof S]: S[K]['optional'] extends true ? string | undefined : string
  }
}

/**
 * For a port's `probe`: one request to the vendor, an error that says what to fix when it fails. The message names
 * the host and the variables behind it, never a bare "fetch failed": unreachable (`host`: the variable the host
 * comes from; left out for a vendor's fixed host, and the message says to check the network), credentials refused
 * (401/403: `credentials`), not found (404: `notFound`), any other status.
 */
export async function checkEndpoint(
  url: string,
  init: NonNullable<Parameters<typeof fetch>[1]>,
  variables: { host?: string; credentials: string; notFound?: string }
): Promise<void> {
  const host = new URL(url).host
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(5000) })
  } catch (error) {
    const e = error as {
      name?: string
      message?: string
      cause?: { code?: string; message?: string }
    }
    const why =
      e.name === 'TimeoutError'
        ? 'no answer within 5 s'
        : (e.cause?.code ?? e.cause?.message ?? e.message ?? String(error))
    throw new Error(
      variables.host
        ? `${host} cannot be reached (${variables.host}): ${why}`
        : `${host} cannot be reached (the vendor's fixed host: check this machine's network or proxy): ${why}`
    )
  }
  if (response.ok) {
    return
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `${host} refused the credentials (${variables.credentials}): HTTP ${response.status}`
    )
  }
  if (response.status === 404 && variables.notFound) {
    throw new Error(
      `${host} has nothing at ${new URL(url).pathname} (${variables.notFound}): HTTP 404`
    )
  }
  throw new Error(
    `${host} answered HTTP ${response.status}${variables.host ? ` (${variables.host})` : ''}`
  )
}
