import { cache } from 'react'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { createBffFetchServer } from '@/lib/bff/core/bff-fetch-server'
import { ProductService } from './lib/product-service'

export const getProductPage = cache(
  async (slug: string, variantId?: string): Promise<ProductPageResponse> => {
    const bffFetch = await createBffFetchServer()
    const productService = new ProductService(bffFetch)
    return productService.getProductPage(slug, variantId)
  }
)
