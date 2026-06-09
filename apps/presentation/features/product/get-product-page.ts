import { cache } from 'react'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { PRODUCT_PAGE_REVALIDATE_SECONDS } from '@config/constants'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { getBffCacheOptions } from '@/lib/bff/bff-cache-options'
import { ProductService } from './lib/product-service'

export const getProductPage = cache(
  async (
    slug: string,
    variantId?: string,
    isDraft = false
  ): Promise<ProductPageResponse> => {
    const bffFetch = await createBffFetchServer({ isDraft })
    const cacheOptions = getBffCacheOptions(PRODUCT_PAGE_REVALIDATE_SECONDS, {
      isDraft,
    })
    const productService = new ProductService(bffFetch)
    return productService.getProductPage(slug, variantId, cacheOptions)
  }
)
