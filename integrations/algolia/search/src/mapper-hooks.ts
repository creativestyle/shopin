import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { AlgoliaProductHit } from './mappers/algolia-hit-to-product'

/** The shop's mapper hooks (`algolia({ mappers })`, docs/extending.md): run after the built-in mapper. */
export interface AlgoliaMappers {
  /** Every search hit: `hit` is the Algolia record as indexed (every attribute), `mapped` the card. */
  productCard?: (
    hit: AlgoliaProductHit,
    mapped: ProductCardResponse
  ) => ProductCardResponse & Record<string, unknown>
}
