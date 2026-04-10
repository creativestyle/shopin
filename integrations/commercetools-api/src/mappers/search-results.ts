import type { ProductSearchResult } from '@commercetools/platform-sdk'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { mapProductToCard } from './product-card'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'

/**
 * Maps CT product search results to ProductCardResponse[].
 * Filters out results without productProjection and maps the rest.
 */
export function mapSearchResultsToCards(
  results: ProductSearchResult[],
  language: string
): ProductCardResponse[] {
  return results
    .filter((r) => r.productProjection)
    .map((r) =>
      mapProductToCard(
        r.productProjection as ProductProjectionApiResponse,
        language
      )
    )
}
