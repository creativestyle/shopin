import { BaseService } from '@/lib/bff/services/base-service'
import {
  ProductSearchQuerySchema,
  ProductSearchResponseSchema,
  type ProductSearchResponse,
} from '@core/contracts/product-search/product-search'

export class ProductSearchBffService extends BaseService {
  async searchProducts(
    query: string,
    limit: number = 4
  ): Promise<ProductSearchResponse> {
    ProductSearchQuerySchema.parse(query)

    const data = await this.get<ProductSearchResponse>('productSearch', {
      queryParams: { query, limit },
    })

    return ProductSearchResponseSchema.parse(data)
  }
}
