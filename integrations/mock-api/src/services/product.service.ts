import { Injectable, Inject } from '@nestjs/common'
import { MOCK_API, MockApi } from '../client/client.module'
import { LANGUAGE_TOKEN, resolveCurrencyFromLanguage } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductResponse } from '@core/contracts/product/product'
import { generateSeed } from '../helpers/generateSeed'
import { createShopinProductDetails } from '../generators'

@Injectable()
export class ProductService {
  constructor(
    @Inject(MOCK_API) private readonly mockApi: MockApi,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async getProduct(
    productSlug: string,
    variantId?: string
  ): Promise<ProductResponse> {
    const faker = this.mockApi.getFaker()
    faker.seed(generateSeed(productSlug))
    const productBase = createShopinProductDetails(faker, variantId)
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const product = {
      ...productBase,
      price: { ...productBase.price, currency },
    }
    return {
      product,
      breadcrumb: [
        {
          label: faker.commerce.department(),
          path: `/c/${faker.helpers.slugify(faker.commerce.department()).toLocaleLowerCase()}`,
        },
        { label: product.name, path: `/p/${product.slug}` },
      ],
    }
  }
}
