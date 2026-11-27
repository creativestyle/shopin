import type { PortError } from '@core/integration-kit'

/**
 * What a commercetools API error means for the shopper (the port's `errors`). commercetools answers with an HTTP
 * status and, for some, an OAuth `error` or a message:
 * - 400: the request caused it (a page beyond the searchable range, a value the platform refuses): 400.
 * - 401: the shopper's token expired or was revoked: 401, which the BFF renews.
 * - 403 for a token of the wrong grant ("Resource Owner Password Credentials Grant", an anonymous token on a
 *   customer-only endpoint): 403. Any other 403 (the API client lacks a scope): 502, the shop's setup, not the shopper.
 * - 404, 409: as they are.
 * - 500, 502: 502; 503: 503; 504: 504.
 * Anything else (a network failure, a bug) is left to the BFF.
 */
export function commercetoolsErrorMeaning(
  error: unknown
): PortError | undefined {
  const e = error as {
    statusCode?: unknown
    body?: { statusCode?: unknown; message?: unknown }
    message?: unknown
  }
  const status = [e?.statusCode, e?.body?.statusCode].find(
    (s): s is number => typeof s === 'number'
  )
  if (status === undefined) {
    return undefined
  }
  const text = [e?.message, e?.body?.message]
    .filter((m): m is string => typeof m === 'string')
    .join(' ')
  switch (status) {
    case 400:
      return { status: 400 }
    case 401:
      return { status: 401 }
    case 403:
      return text.includes('Resource Owner Password Credentials Grant')
        ? { status: 403 }
        : { status: 502, message: 'The platform refused the request' }
    case 404:
      return { status: 404 }
    case 409:
      return { status: 409 }
    case 500:
    case 502:
      return { status: 502 }
    case 503:
      return { status: 503 }
    case 504:
      return { status: 504 }
    default:
      return undefined
  }
}
