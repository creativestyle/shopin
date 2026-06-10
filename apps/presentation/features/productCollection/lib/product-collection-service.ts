import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'
import {
  ProductCollectionPageResponse,
  ProductCollectionPageResponseSchema,
  ProductCollectionSlugSchema,
  type Filters,
} from '@core/contracts/product-collection/product-collection-page'
import { BaseService } from '@/lib/bff/services/base-service'
import type { BffCacheOptions } from '@/lib/bff/bff-cache-options'

/**
 * Service for product collection operations
 */
export interface ProductCollectionPageOptions {
  page?: number
  limit?: number
  sort?: SortOption
  filters?: Filters
  saleOnly?: boolean
  priceMin?: number
  priceMax?: number
}

export class ProductCollectionService extends BaseService {
  async getProductCollectionPage(
    slug: string,
    cacheOptions: BffCacheOptions,
    opts?: ProductCollectionPageOptions
  ): Promise<ProductCollectionPageResponse> {
    ProductCollectionSlugSchema.parse(slug)

    const {
      page = MIN_PAGE,
      limit = ITEMS_PER_PAGE,
      sort = DEFAULT_SORT_OPTION,
      filters,
      saleOnly = false,
      priceMin,
      priceMax,
    } = opts ?? {}

    const queryParams: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
      sort,
    }

    if (filters && Object.keys(filters).length > 0) {
      queryParams.filters = JSON.stringify(filters)
    }

    if (saleOnly) {
      queryParams.saleOnly = 'true'
    }

    if (priceMin !== undefined) {
      queryParams.priceMin = priceMin.toString()
    }
    if (priceMax !== undefined) {
      queryParams.priceMax = priceMax.toString()
    }

    const data = await this.get<ProductCollectionPageResponse>(
      `productCollection/slug/${slug}/page`,
      {
        queryParams,
        ...cacheOptions,
      }
    )
    return ProductCollectionPageResponseSchema.parse(data)
  }
}
