import type {
  ProductSearchFacetResult,
  ProductSearchFacetResultBucket,
} from '@commercetools/platform-sdk'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'

export function extractPriceRange(
  facetResults: ProductSearchFacetResult[] | undefined
): PriceRange | undefined {
  if (!facetResults) {
    return undefined
  }

  const priceFacetResult = facetResults.find(
    (f) => f.name === 'price-facet'
  ) as ProductSearchFacetResultBucket | undefined

  if (!priceFacetResult?.buckets || priceFacetResult.buckets.length === 0) {
    return undefined
  }

  const prices = priceFacetResult.buckets
    .map((b) => Number(b.key))
    .filter((p) => !isNaN(p))

  if (prices.length === 0) {
    return undefined
  }

  return {
    minPriceInCents: Math.min(...prices),
    maxPriceInCents: Math.max(...prices),
  }
}
