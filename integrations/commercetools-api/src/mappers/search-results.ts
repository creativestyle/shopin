import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { mapProductToCard } from './product-card'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'

/**
 * Maps CT product projections to ProductCardResponse[], preserving the order
 * of the given `orderedIds` array (which comes from search results).
 */
export function mapProjectionsToCards(
  orderedIds: string[],
  projections: ProductProjectionApiResponse[],
  language: string
): ProductCardResponse[] {
  const byId = new Map(projections.map((p) => [p.id, p]))
  return orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is ProductProjectionApiResponse => p !== undefined)
    .map((p) => mapProductToCard(p, language))
}
