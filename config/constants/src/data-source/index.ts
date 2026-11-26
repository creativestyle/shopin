export type DataSource =
  | 'mock-set'
  | 'commercetools-set'
  | 'commercetools-algolia-set'

export const ALLOWED_DATA_SOURCES: readonly DataSource[] = [
  'mock-set',
  'commercetools-set',
  'commercetools-algolia-set',
] as const

export const DEFAULT_DATA_SOURCE: DataSource = 'commercetools-set'

/** Cookie written by the selector; read by the edge proxy to derive the variant. */
export const DATA_SOURCE_COOKIE = 'data-source' as const

/** Request header injected by the edge proxy; read by Next.js middleware to pick the ISR variant. */
export const DATA_SOURCE_HEADER = 'X-Data-Source' as const

/**
 * Data sources whose backend keeps its own sessions and carts (mock: in BFF
 * memory) get this suffix on their token and cart cookies, so switching data
 * source never hands one backend another's ids.
 */
export const DATA_SOURCE_COOKIE_SUFFIX: Partial<Record<DataSource, string>> = {
  'mock-set': 'mock',
}
