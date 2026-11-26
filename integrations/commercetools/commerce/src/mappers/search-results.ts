import type { ProductProjection } from '@commercetools/platform-sdk'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { CommercetoolsMappers } from '../mapper-hooks'
import { mapProductToCard } from './product-card'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'

/**
 * Maps CT product projections to ProductCardResponse[], preserving the order
 * of the given `orderedIds` array (which comes from search results).
 */
export function mapProjectionsToCards(
  orderedIds: string[],
  projections: ProductProjectionApiResponse[],
  language: string,
  hook?: CommercetoolsMappers['productCard']
): ProductCardResponse[] {
  const byId = new Map(projections.map((p) => [p.id, p]))
  return orderedIds
    .map((id) => byId.get(id))
    .filter((p) => p !== undefined)
    .map((p) => {
      const card = mapProductToCard(p, language)
      // the shop's hook runs after the built-in mapper
      return hook ? hook(p as unknown as ProductProjection, card) : card
    })
}
