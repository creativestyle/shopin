import { Injectable } from '@nestjs/common'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'

@Injectable()
export class ProductSearchService {
  async searchProducts(
    _query: string,
    _limit?: number
  ): Promise<ProductSearchResponse> {
    return {
      suggestions: [],
      products: [],
    }
  }
}
