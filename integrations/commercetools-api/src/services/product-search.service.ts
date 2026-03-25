import { Injectable, Inject } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import {
  LANGUAGE_TOKEN,
  resolveCurrencyFromLanguage,
  resolveCountryFromLanguage,
} from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import { mapProductToCard } from '../mappers/product-card'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'

const PRODUCTS_LIMIT = 4

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async searchProducts(
    query: string,
    limit: number = PRODUCTS_LIMIT
  ): Promise<ProductSearchResponse> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)
    const lowerQuery = query.toLowerCase()

    // Use wildcard on the newer Product Search API to match any word in the name
    // starting with the query (e.g. "sta" matches "Starter Bundle", "Standard Guitar")
    const searchResponse = await this.client
      .products()
      .search()
      .post({
        body: {
          query: {
            or: [
              {
                wildcard: {
                  field: 'name',
                  language: currentLanguage,
                  value: `${lowerQuery}*`,
                  caseInsensitive: true,
                },
              },
              {
                wildcard: {
                  field: 'name',
                  language: currentLanguage,
                  value: `* ${lowerQuery}*`,
                  caseInsensitive: true,
                },
              },
            ],
          },
          productProjectionParameters: {
            priceCurrency: currency,
            priceCountry: country,
            staged: false,
          },
          limit,
          offset: 0,
        },
      })
      .execute()

    const allProducts = (searchResponse.body.results || [])
      .filter((r) => r.productProjection)
      .map((r) =>
        mapProductToCard(
          r.productProjection as unknown as ProductProjectionApiResponse,
          currentLanguage
        )
      )

    const products = allProducts.slice(0, limit)

    return {
      suggestions: [],
      products,
    }
  }
}
