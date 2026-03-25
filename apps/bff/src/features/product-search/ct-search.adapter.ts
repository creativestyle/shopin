import { Injectable } from '@nestjs/common'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from './search-provider.interface'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class CtSearchAdapter implements SearchProvider {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const { productSearchService } = this.dataSourceFactory.getServices()
    const result = await productSearchService.searchProducts(
      options.query,
      options.limit
    )
    return { products: result.products }
  }

  async getSuggestions(): Promise<string[]> {
    // CT doesn't have a dedicated suggestions API
    return []
  }
}
