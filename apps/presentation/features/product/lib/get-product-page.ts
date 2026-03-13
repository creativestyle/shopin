import { cache } from 'react'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { ProductService } from './product-service'

/**
 * Fetch product page data by slug. Cached per request when called from server components.
 * Used only inside the product feature.
 */
export const getProductPage = cache(
  async (slug: string, variantId?: string): Promise<ProductPageResponse> => {
    const bffFetch = await createBffFetchServer()
    const productService = new ProductService(bffFetch)
    return productService.getProductPage(slug, variantId)
  }
)
