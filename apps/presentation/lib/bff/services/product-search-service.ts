import { BaseService } from '@/lib/bff/services/base-service'
import {
  ProductSearchQuerySchema,
  ProductSearchResponseSchema,
  type ProductSearchResponse,
} from '@core/contracts/product-search/product-search'

export interface ProductSearchParams {
  query: string
  limit?: number
  page?: number
  filters?: Record<string, string[]>
  priceMin?: number
  priceMax?: number
  sort?: string
  saleOnly?: boolean
}

export class ProductSearchBffService extends BaseService {
  async searchProducts(
    params: ProductSearchParams
  ): Promise<ProductSearchResponse> {
    const {
      query,
      limit = 4,
      page,
      filters,
      priceMin,
      priceMax,
      sort,
      saleOnly,
    } = params
    ProductSearchQuerySchema.parse(query)

    const queryParams: Record<
      string,
      string | number | boolean | null | undefined
    > = {
      query,
      limit,
    }
    if (page !== undefined) {
      queryParams.page = page
    }
    if (filters && Object.keys(filters).length > 0) {
      queryParams.filters = JSON.stringify(filters)
    }
    if (priceMin !== undefined) {
      queryParams.priceMin = priceMin
    }
    if (priceMax !== undefined) {
      queryParams.priceMax = priceMax
    }
    if (sort) {
      queryParams.sort = sort
    }
    if (saleOnly) {
      queryParams.saleOnly = true
    }

    const data = await this.get<ProductSearchResponse>('productSearch', {
      queryParams,
    })

    return ProductSearchResponseSchema.parse(data)
  }
}
