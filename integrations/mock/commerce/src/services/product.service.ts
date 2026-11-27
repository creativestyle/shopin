import { RequestContext } from '@core/integration-kit'
import { Injectable, Inject } from '@nestjs/common'
import { MOCK_API, MockApi } from '../client/client.module'
import { resolveCurrencyFromLanguage } from '@core/i18n'
import type { ProductResponse } from '@core/contracts/product/product'
import { generateSeed } from '../helpers/generateSeed'
import { createShopinProductDetails } from '../generators'
import { buildCategoryPath, buildProductPath } from '@config/constants'
import { createMockAttributes } from '../generators/shopin-product-cards'
import type { MockProduct } from '../options'

@Injectable()
export class ProductService {
  constructor(
    @Inject(MOCK_API) private readonly mockApi: MockApi,
    private readonly languageProvider: RequestContext
  ) {}

  async getProduct(
    productSlug: string,
    variantId?: string
  ): Promise<ProductResponse & { product: MockProduct }> {
    const faker = this.mockApi.getFaker()
    faker.seed(generateSeed(productSlug))
    const productBase = createShopinProductDetails(faker, variantId)
    // the catalog record's attributes: stripped by the contract, read by a shop's mapper hook
    const attributes = createMockAttributes(faker)
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const product = {
      ...productBase,
      price: productBase.price && { ...productBase.price, currency },
      attributes,
    }
    return {
      product,
      breadcrumb: [
        {
          label: faker.commerce.department(),
          path: buildCategoryPath(
            faker.helpers
              .slugify(faker.commerce.department())
              .toLocaleLowerCase()
          ),
        },
        { label: product.name, path: buildProductPath(product.slug) },
      ],
    }
  }
}
