import { DEFAULT_SUGGESTION_LIMIT, type SortOption } from '@config/constants'
import {
  SUGGESTION_FETCH_SIZE,
  type SearchProvider,
  type SearchProductsOptions,
  type SearchProductsResult,
} from '@core/contracts/product-search/search-provider'
import { extractQuerySuggestions } from '@core/contracts/product-search/suggestion-utils'
import type { ProductSearchService } from '@core/contracts/core/data-source-interfaces'

/**
 * Search served by the commerce platform itself: adapts the commerce integration's product search (the
 * `productSearchService` every commerce port with search provides) to the search contract. No index, no vendor code.
 * It belongs to the BFF, not to an integration: it has no vendor, and it is the search a shop gets when it configures
 * no search integration.
 */
export class CommerceSearchProvider implements SearchProvider {
  constructor(private readonly productSearchService: ProductSearchService) {}

  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const result = await this.productSearchService.searchProducts({
      query: options.query,
      faceted: true,
      limit: options.limit,
      page: options.page,
      filters: options.filters,
      priceMin: options.priceMin,
      priceMax: options.priceMax,
      sort: options.sort as SortOption | undefined,
      saleOnly: options.saleOnly,
    })
    return {
      products: result.products,
      facets: result.facets,
      priceRange: result.priceRange,
      total: result.total,
    }
  }

  async getSuggestions(
    query: string,
    _language: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT
  ): Promise<string[]> {
    const result = await this.productSearchService.searchProducts({
      query,
      limit: SUGGESTION_FETCH_SIZE,
    })
    const names = result.products.map((p) => p.name)
    return extractQuerySuggestions(names, query, limit)
  }
}
