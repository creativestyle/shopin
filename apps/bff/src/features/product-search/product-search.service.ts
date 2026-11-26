import { Injectable, Inject, Scope } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '../../common/language/language.provider'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import type { SearchProductsOptions } from '@core/contracts/product-search/search-provider'
import { Services } from '../../data-source/ports.module'

export type SearchProductsParams = Omit<SearchProductsOptions, 'language'>

@Injectable({ scope: Scope.REQUEST })
export class ProductSearchService {
  constructor(
    private readonly services: Services,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async searchProducts(
    params: SearchProductsParams
  ): Promise<ProductSearchResponse> {
    const language = this.languageProvider.getCurrentLanguage()
    const { query, limit, page, filters, priceMin, priceMax, sort, saleOnly } =
      params

    const [searchResult, suggestions] = await Promise.all([
      this.services.searchService.searchProducts({
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
      this.services.searchService.getSuggestions(query, language),
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
