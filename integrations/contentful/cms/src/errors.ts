import type { PortError } from '@core/integration-kit'

/**
 * What a Contentful error means for the shopper (the CMS port's `errors`). Contentful's GraphQL API answers with an
 * HTTP status (graphql-request puts it on `response.status`). A 4xx there is the shop's setup (token, space,
 * environment, a query the content model does not support), never the shopper's request: 502 with a fixed message.
 * 429 (rate limit): 503. 500, 502: 502; 503: 503; 504: 504. A page that does not exist is already a 404 of the
 * port's own. Anything else (a network failure, a bug) is left to the BFF.
 */
export function contentfulErrorMeaning(error: unknown): PortError | undefined {
  const status = (error as { response?: { status?: unknown } })?.response
    ?.status
  if (typeof status !== 'number') {
    return undefined
  }
  if (status === 429 || status === 503) {
    return { status: 503 }
  }
  if (status === 504) {
    return { status: 504 }
  }
  if (status >= 400 && status < 500) {
    return { status: 502, message: 'The content platform refused the request' }
  }
  if (status >= 500) {
    return { status: 502 }
  }
  return undefined
}
