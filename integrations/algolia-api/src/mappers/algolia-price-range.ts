import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import type { SearchResponse } from 'algoliasearch'
import type { AlgoliaProductHit } from './algolia-hit-to-product'

export function mapAlgoliaPriceRange(
  statsResponse: SearchResponse<AlgoliaProductHit>,
  priceField: string
): PriceRange | undefined {
  const stats =
    (statsResponse as SearchResponse<AlgoliaProductHit> & { facets_stats?: Record<string, { min: number; max: number }> }).facets_stats?.[priceField]
  if (!stats) {
    return undefined
  }

  return {
    minPriceInCents: Math.floor(stats.min),
    maxPriceInCents: Math.ceil(stats.max),
  }
}
