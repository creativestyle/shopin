import { PRODUCT_PAGE_REVALIDATE_SECONDS } from '@config/constants'
import {
  ProductPageResponse,
  ProductPageResponseSchema,
  ProductSlugSchema,
  VariantIdSchema,
} from '@core/contracts/product/product-page'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for product operations. Used only inside the product feature.
 */
export class ProductService extends BaseService {
  /**
   * Get product page data by slug
   * @param slug - Product slug
   * @param variantId - Optional variant ID
   */
  async getProductPage(
    slug: string,
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
        next: {
          revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS,
        },
      }
    )
    return ProductPageResponseSchema.parse(data)
  }
}
