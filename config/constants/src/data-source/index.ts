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
