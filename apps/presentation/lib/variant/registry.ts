import {
  ALLOWED_DATA_SOURCES,
  DEFAULT_DATA_SOURCE,
  DATA_SOURCE_COOKIE,
  DATA_SOURCE_HEADER,
} from '@config/constants'

export type VariantDimension = {
  name: string
  cookie: string
  header: string
  allowed: readonly string[]
  defaultValue: string
}

export const VARIANT_DIMENSIONS: readonly VariantDimension[] = [
  {
    name: 'dataSource',
    cookie: DATA_SOURCE_COOKIE,
    header: DATA_SOURCE_HEADER,
    allowed: ALLOWED_DATA_SOURCES,
    defaultValue: DEFAULT_DATA_SOURCE,
  },
]
