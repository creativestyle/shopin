import { Injectable, Inject } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '../../common/language/language.provider'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import { SEARCH_PROVIDER, type SearchProvider } from './search-provider.interface'

export interface SearchProductsParams {
  query: string
  limit?: number
  page?: number
  filters?: Record<string, string[]>
  priceMin?: number
  priceMax?: number
  sort?: string
  saleOnly?: boolean
}

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(SEARCH_PROVIDER) private readonly searchProvider: SearchProvider,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async searchProducts(
    params: SearchProductsParams
  ): Promise<ProductSearchResponse> {
    const language = this.languageProvider.getCurrentLanguage()
    const { query, limit, page, filters, priceMin, priceMax, sort, saleOnly } = params

    const [searchResult, suggestions] = await Promise.all([
      this.searchProvider.searchProducts({
        query,
        language,
        limit,
        page,
        filters,
        priceMin,
        priceMax,
        sort,
        saleOnly,
      }),
      this.searchProvider.getSuggestions(query, language),
    ])

    return {
      suggestions,
      products: searchResult.products,
      facets: searchResult.facets,
      priceRange: searchResult.priceRange,
      total: searchResult.total,
    }
  }
}
