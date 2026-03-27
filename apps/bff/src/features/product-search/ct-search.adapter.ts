import { Injectable } from '@nestjs/common'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from './search-provider.interface'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { extractQuerySuggestions } from './suggestion-utils'
import type { SortOption } from '@config/constants'

@Injectable()
export class CtSearchAdapter implements SearchProvider {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const { productSearchService } = this.dataSourceFactory.getServices()
    const result = await productSearchService.searchProducts(
      options.query,
      options.limit,
      options.page,
      options.filters,
      options.priceMin,
      options.priceMax,
      options.sort as SortOption | undefined,
      options.saleOnly
    )
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
    limit: number = 10
  ): Promise<string[]> {
    const { productSearchService } = this.dataSourceFactory.getServices()
    const result = await productSearchService.searchProducts(query, 30)
    const names = result.products.map((p) => p.name)
    return extractQuerySuggestions(names, query, limit)
  }
}
