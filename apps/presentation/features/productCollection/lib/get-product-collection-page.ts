import { cache } from 'react'
import type {
  ProductCollectionPageResponse,
  Filters,
} from '@core/contracts/product-collection/product-collection-page'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { ProductCollectionService } from './product-collection-service'
import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'

/**
 * Fetch product collection page data by slug. Cached per request when called from server components.
 * Used only inside the productCollection feature.
 * @param slug - Product collection slug
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param sort - Sort option
 * @param filters - Optional filters to apply
 * @param saleOnly - When true, only show discounted products
 * @param priceMin - Minimum price in cents (optional)
 * @param priceMax - Maximum price in cents (optional)
 */
export const getProductCollectionPage = cache(
  async (
    slug: string,
    page: number = MIN_PAGE,
    limit: number = ITEMS_PER_PAGE,
    sort: SortOption = DEFAULT_SORT_OPTION,
    filters?: Filters,
    saleOnly: boolean = false,
    priceMin?: number,
    priceMax?: number
  ): Promise<ProductCollectionPageResponse> => {
    const bffFetch = await createBffFetchServer()
    const productCollectionService = new ProductCollectionService(bffFetch)
    return productCollectionService.getProductCollectionPage(
      slug,
      page,
      limit,
      sort,
      filters,
      saleOnly,
      priceMin,
      priceMax
    )
  }
)
