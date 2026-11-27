import type { Client } from '@integrations/commercetools-core'
import {
  ProductProjectionPagedQueryApiResponseSchema,
  type ProductProjectionApiResponse,
} from '../schemas/product-projection'
import { buildInClause } from './build-in-clause'

/**
 * Fetches Product Projections by product IDs.
 * Used as the data-integration step after Product Search
 * (which no longer returns `productProjection` inline).
 * `priceChannel`: the store's distribution channel (StoreChannels); without it prices are selected by currency and
 * country only.
 *
 * @see https://docs.commercetools.com/api/releases/2025-12-11-deprecated-product-projection-parameters-in-product-search
 */
export async function fetchProjectionsByIds(
  client: Client,
  ids: string[],
  language: string,
  currency: string,
  country: string,
  priceChannel?: string
): Promise<ProductProjectionApiResponse[]> {
  if (ids.length === 0) {
    return []
  }

  const wherePredicate = buildInClause('id', ids)

  const response = await client
    .productProjections()
    .get({
      queryArgs: {
        where: wherePredicate,
        staged: false,
        localeProjection: language,
        priceCurrency: currency,
        priceCountry: country,
        ...(priceChannel && { priceChannel }),
        limit: ids.length,
      },
    })
    .execute()

  const parsed = ProductProjectionPagedQueryApiResponseSchema.parse(
    response.body
  )
  return parsed.results
}
