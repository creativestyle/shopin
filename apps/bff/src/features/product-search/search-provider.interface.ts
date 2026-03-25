import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'

export const SEARCH_PROVIDER = Symbol('SEARCH_PROVIDER')

export interface SearchProvider {
  searchProducts(
    query: string,
    language: string,
    limit?: number
  ): Promise<ProductCardResponse[]>

  getSuggestions(
    query: string,
    language: string,
    limit?: number
  ): Promise<string[]>
}
