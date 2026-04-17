import type { Client } from '../client/client.module'
import {
  ProductProjectionPagedQueryApiResponseSchema,
  type ProductProjectionApiResponse,
} from '../schemas/product-projection'

/**
 * Fetches Product Projections by product IDs.
 * Used as the data-integration step after Product Search
 * (which no longer returns `productProjection` inline).
 *
 * @see https://docs.commercetools.com/api/releases/2025-12-11-deprecated-product-projection-parameters-in-product-search
 */
export async function fetchProjectionsByIds(
  client: Client,
  ids: string[],
  language: string,
  currency: string,
  country: string
): Promise<ProductProjectionApiResponse[]> {
  if (ids.length === 0) {
    return []
  }

  const wherePredicate = `id in (${ids.map((id) => `"${id}"`).join(',')})`

  const response = await client
    .productProjections()
    .get({
      queryArgs: {
        where: wherePredicate,
        staged: false,
        localeProjection: language,
        priceCurrency: currency,
        priceCountry: country,
        limit: ids.length,
      },
    })
    .execute()

  const parsed = ProductProjectionPagedQueryApiResponseSchema.parse(
    response.body
  )
  return parsed.results
}
