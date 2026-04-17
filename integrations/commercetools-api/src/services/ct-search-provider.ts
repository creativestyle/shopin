import { DEFAULT_SUGGESTION_LIMIT, type SortOption } from '@config/constants'
import {
  SUGGESTION_FETCH_SIZE,
  type SearchProvider,
  type SearchProductsOptions,
  type SearchProductsResult,
} from '@core/contracts/product-search/search-provider'
import { extractQuerySuggestions } from '@core/contracts/product-search/suggestion-utils'
import type { ProductSearchService } from './product-search.service'

export class CtSearchProvider implements SearchProvider {
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
