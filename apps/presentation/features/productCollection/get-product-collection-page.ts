import { cache } from 'react'
import type {
  ProductCollectionPageResponse,
  Filters,
} from '@core/contracts/product-collection/product-collection-page'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { ProductCollectionService } from './lib/product-collection-service'
import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'

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
