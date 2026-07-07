import {
  ProductPageResponse,
  ProductPageResponseSchema,
  ProductSlugSchema,
  VariantIdSchema,
} from '@core/contracts/product/product-page'
import { BaseService } from '@/lib/bff/services/base-service'
import type { BffCacheOptions } from '@/lib/bff/bff-cache-options'

/**
 * Service for product operations. Used only inside the product feature.
 */
export class ProductService extends BaseService {
  async getProductPage(
    slug: string,
    cacheOptions: BffCacheOptions,
    variantId?: string
  ): Promise<ProductPageResponse> {
    ProductSlugSchema.parse(slug)
    if (variantId) {
      VariantIdSchema.parse(variantId)
    }

    const data = await this.get<ProductPageResponse>(
      `/product/slug/${slug}/page`,
      {
        queryParams: variantId ? { variantId } : undefined,
        ...cacheOptions,
      }
    )
    return ProductPageResponseSchema.parse(data)
  }
}
