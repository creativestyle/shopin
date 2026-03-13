import { Injectable } from '@nestjs/common'
import type { ProductPageResponse } from '@core/contracts/product/product-page'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Injectable()
export class ProductService {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async getProductPage(
    productSlug: string,
    variantId?: string
  ): Promise<ProductPageResponse> {
    const { productService } = this.dataSourceFactory.getServices()
    const response = await productService.getProduct(productSlug, variantId)

    return {
      breadcrumb: response.breadcrumb,
      product: response.product,
    }
  }
}
