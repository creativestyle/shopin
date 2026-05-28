import { ALLOWED_DATA_SOURCES, DEFAULT_DATA_SOURCE } from '@config/constants'

export type VaryDimension = {
  name: string
  cookie: string
  header: string
  allowed: readonly string[]
  defaultValue: string
}

export const VARY_DIMENSIONS: readonly VaryDimension[] = [
  {
    name: 'dataSource',
    cookie: 'data-source',
    header: 'X-Data-Source',
    allowed: ALLOWED_DATA_SOURCES,
    defaultValue: DEFAULT_DATA_SOURCE,
  },
]
