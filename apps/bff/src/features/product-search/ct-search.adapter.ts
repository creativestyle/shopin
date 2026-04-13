import { Injectable } from '@nestjs/common'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from './search-provider.interface'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { extractQuerySuggestions } from './suggestion-utils'
import { SUGGESTION_FETCH_SIZE } from './search-provider.interface'
import { DEFAULT_SUGGESTION_LIMIT, type SortOption } from '@config/constants'

@Injectable()
export class CtSearchAdapter implements SearchProvider {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const { productSearchService } = this.dataSourceFactory.getServices()
    const result = await productSearchService.searchProducts({
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
    language: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT
  ): Promise<string[]> {
    const { productSearchService } = this.dataSourceFactory.getServices()
    const result = await productSearchService.searchProducts({
      query,
      limit: SUGGESTION_FETCH_SIZE,
    })
    const names = result.products.map((p) => p.name)
    return extractQuerySuggestions(names, query, limit)
  }
}
