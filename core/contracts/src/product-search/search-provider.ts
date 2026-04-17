import type { ProductCardResponse } from '../product-collection/product-card'
import type { Facet } from '../product-collection/facet'
import type { PriceRange } from '../product-collection/product-collection'

/**
 * Number of results to fetch before deduplication/extraction of query suggestions.
 * Must be larger than DEFAULT_SUGGESTION_LIMIT so the extraction step has enough
 * candidates to work with.
 */
export const SUGGESTION_FETCH_SIZE = 30

export interface SearchProductsOptions {
  query: string
  language: string
  limit?: number
  page?: number
  filters?: Record<string, string[]>
  priceMin?: number
  priceMax?: number
  sort?: string
  saleOnly?: boolean
}

export interface SearchProductsResult {
  products: ProductCardResponse[]
  facets?: Facet[]
  priceRange?: PriceRange
  total: number
}

export interface SearchProvider {
  searchProducts(options: SearchProductsOptions): Promise<SearchProductsResult>

  getSuggestions(
    query: string,
    language: string,
    limit?: number
  ): Promise<string[]>
}
