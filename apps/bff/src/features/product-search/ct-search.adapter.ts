import { Injectable } from '@nestjs/common'
import type { SearchProvider } from './search-provider.interface'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class CtSearchAdapter implements SearchProvider {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async searchProducts(
    query: string,
    _language: string,
    limit?: number
  ): Promise<ProductCardResponse[]> {
    const { productSearchService } = this.dataSourceFactory.getServices()
    const result = await productSearchService.searchProducts(query, limit)
    return result.products
  }

  async getSuggestions(): Promise<string[]> {
    // CT doesn't have a dedicated suggestions API
    return []
  }
}
