import { STOREFRONT } from '@/lib/storefront-config'

export type VariantDimension = {
  name: string
  cookie: string
  header: string
  allowed: readonly string[]
  defaultValue: string
}

/**
 * The storefront's request variants (an integration that declares them in its descriptor, `storefront.variants`):
 * one dimension each, in order. None without one.
 */
export const VARIANT_DIMENSIONS: readonly VariantDimension[] =
  STOREFRONT.variants.dimensions.map((d) => ({
    name: d.name,
    cookie: d.cookie,
    header: d.header,
    allowed: d.values,
    defaultValue: d.default,
  }))
