import { Injectable } from '@nestjs/common'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { Services } from '../../data-source/ports.module'

@Injectable()
export class ProductService {
  constructor(private readonly services: Services) {}

  async getProductPage(
    productSlug: string,
    variantId?: string
  ): Promise<ProductPageResponse> {
    const response = await this.services.productService.getProduct(
      productSlug,
      variantId
    )

    return {
      breadcrumb: response.breadcrumb,
      product: response.product,
      seo: response.seo,
    }
  }
}
