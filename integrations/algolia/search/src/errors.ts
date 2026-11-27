import type { PortError } from '@core/integration-kit'

/**
 * What an Algolia error means for the shopper (the search port's `errors`). The client's API errors carry the HTTP
 * `status`; when every host failed it throws a `RetryError`.
 * - 400: the request caused it (a query or filter Algolia refuses): 400.
 * - 401, 403, 404: the shop's setup (API key, index name), not the shopper: 502 with a fixed message.
 * - 429 (rate limit), 503, and a RetryError (no host reachable): 503. 500, 502: 502; 504: 504.
 * Anything else (a bug) is left to the BFF.
 */
export function algoliaErrorMeaning(error: unknown): PortError | undefined {
  const e = error as { status?: unknown; name?: unknown }
  if (e?.name === 'RetryError') {
    return { status: 503 }
  }
  if (typeof e?.status !== 'number') {
    return undefined
  }
  switch (e.status) {
    case 400:
      return { status: 400 }
    case 401:
    case 403:
    case 404:
      return { status: 502, message: 'The search platform refused the request' }
    case 429:
    case 503:
      return { status: 503 }
    case 504:
      return { status: 504 }
    default:
      return e.status >= 500 ? { status: 502 } : undefined
  }
}
