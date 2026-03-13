import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  PRODUCT_COLLECTION_PAGE_REVALIDATE_SECONDS,
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

/**
 * Service for product collection operations
 */
export class ProductCollectionService extends BaseService {
  /**
   * Get product collection page data by slug
   * @param slug - Product collection slug
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param sort - Sort option
   * @param filters - Optional filters to apply
   * @param saleOnly - When true, only show discounted products
   * @param priceMin - Minimum price in cents (optional)
   * @param priceMax - Maximum price in cents (optional)
   */
  async getProductCollectionPage(
    slug: string,
    page: number = MIN_PAGE,
    limit: number = ITEMS_PER_PAGE,
    sort: SortOption = DEFAULT_SORT_OPTION,
    filters?: Filters,
    saleOnly: boolean = false,
    priceMin?: number,
    priceMax?: number
  ): Promise<ProductCollectionPageResponse> {
    // Validate slug input
    ProductCollectionSlugSchema.parse(slug)

    const queryParams: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
      sort,
    }

    // Add filters as JSON string if present
    if (filters && Object.keys(filters).length > 0) {
      queryParams.filters = JSON.stringify(filters)
    }

    // Add saleOnly if true
    if (saleOnly) {
      queryParams.saleOnly = 'true'
    }

    // Add price range if specified
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
        next: {
          revalidate: PRODUCT_COLLECTION_PAGE_REVALIDATE_SECONDS,
        },
      }
    )
    return ProductCollectionPageResponseSchema.parse(data)
  }
}
