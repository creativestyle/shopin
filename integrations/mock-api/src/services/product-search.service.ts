import { Injectable } from '@nestjs/common'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'

@Injectable()
export class ProductSearchService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async searchProducts(..._args: unknown[]): Promise<ProductSearchResponse> {
    return {
      suggestions: [],
      products: [],
    }
  }
}
