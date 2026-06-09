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
export class ProductCollectionService extends BaseService {
  async getProductCollectionPage(
    slug: string,
    page: number = MIN_PAGE,
    limit: number = ITEMS_PER_PAGE,
    sort: SortOption = DEFAULT_SORT_OPTION,
    filters?: Filters,
    saleOnly: boolean = false,
    priceMin?: number,
    priceMax?: number,
    cacheOptions?: BffCacheOptions
  ): Promise<ProductCollectionPageResponse> {
    ProductCollectionSlugSchema.parse(slug)

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
