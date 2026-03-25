import { Injectable, Inject } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '../../common/language/language.provider'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import { SEARCH_PROVIDER, type SearchProvider } from './search-provider.interface'

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(SEARCH_PROVIDER) private readonly searchProvider: SearchProvider,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async searchProducts(
    query: string,
    limit?: number
  ): Promise<ProductSearchResponse> {
    const language = this.languageProvider.getCurrentLanguage()

    const [products, suggestions] = await Promise.all([
      this.searchProvider.searchProducts(query, language, limit),
      this.searchProvider.getSuggestions(query, language),
    ])

    return {
      suggestions,
      products,
    }
  }
}
