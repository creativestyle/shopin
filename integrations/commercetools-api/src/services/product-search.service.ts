import { Injectable, Inject } from '@nestjs/common'
import type { _SearchQuery } from '@commercetools/platform-sdk'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import {
  LANGUAGE_TOKEN,
  resolveCurrencyFromLanguage,
  resolveCountryFromLanguage,
} from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import type { ProductSearchParams } from '@core/contracts/core/data-source-interfaces'
import {
  DEFAULT_SORT_OPTION,
  MIN_PAGE,
  SEARCH_POPUP_PRODUCT_LIMIT,
} from '@config/constants'
import {
  buildPostFilters,
  buildFacets,
  buildSortExpressions,
  buildAttributeFilters,
} from '../helpers/product-collection-filters'
import { executeFacetedSearch } from '../helpers/faceted-search'
import { mapSearchResultsToCards } from '../mappers/search-results'
import { FilterableAttributesCacheService } from './filterable-attributes-cache.service'

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly filterableAttributesCache: FilterableAttributesCacheService
  ) {}

  private buildQueryParts(
    query: string,
    language: string,
    saleOnly: boolean
  ): _SearchQuery[] {
    const lowerQuery = query.toLowerCase()

    const textQuery = {
      or: [
        {
          wildcard: {
            field: 'name',
            language,
            value: `${lowerQuery}*`,
            caseInsensitive: true,
          },
        },
        {
          wildcard: {
            field: 'name',
            language,
            value: `* ${lowerQuery}*`,
            caseInsensitive: true,
          },
        },
      ],
    }

    return saleOnly
      ? [textQuery, { exists: { field: 'variants.prices.discounted' } }]
      : [textQuery]
  }

  async searchProducts(
    params: ProductSearchParams
  ): Promise<ProductSearchResponse> {
    const {
      query,
      faceted = false,
      limit = SEARCH_POPUP_PRODUCT_LIMIT,
      page = MIN_PAGE,
      filters,
      priceMin,
      priceMax,
      sort = DEFAULT_SORT_OPTION,
      saleOnly = false,
    } = params

    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)
    const offset = (page - 1) * limit

    if (!faceted && !saleOnly) {
      return this.simpleSearch(query, limit, currentLanguage, currency, country)
    }

    // Full faceted search (results page)
    const filterableAttributes =
      await this.filterableAttributesCache.getFilterableAttributes()
    const queryParts = this.buildQueryParts(query, currentLanguage, saleOnly)
    const baseQuery =
      queryParts.length === 1 ? queryParts[0] : { and: queryParts }

    const attributeFilters = buildAttributeFilters(
      filters,
      currentLanguage,
      filterableAttributes
    )
    const postFilters = buildPostFilters(
      filters,
      currentLanguage,
      filterableAttributes,
      currency,
      priceMin,
      priceMax
    )
    const sortExpressions = buildSortExpressions(sort, currentLanguage)
    const facets = buildFacets(currentLanguage, filterableAttributes)

    const hasActiveFilters =
      attributeFilters.length > 0 ||
      priceMin !== undefined ||
      priceMax !== undefined ||
      saleOnly

    const countQueryParts = [...queryParts, ...attributeFilters]
    const countQuery =
      countQueryParts.length === 1
        ? countQueryParts[0]
        : { and: countQueryParts }

    const {
      products,
      facets: mappedFacets,
      priceRange,
      total,
    } = await executeFacetedSearch({
      client: this.client,
      baseQuery,
      countQuery,
      hasActiveFilters,
      postFilters,
      facets,
      sortExpressions,
      language: currentLanguage,
      currency,
      country,
      limit,
      offset,
      filterableAttributes,
    })

    return {
      products,
      facets: mappedFacets,
      priceRange,
      total,
    }
  }

  private async simpleSearch(
    query: string,
    limit: number,
    language: string,
    currency: string,
    country: string
  ): Promise<ProductSearchResponse> {
    const [baseQuery] = this.buildQueryParts(query, language, false)

    const searchResponse = await this.client
      .products()
      .search()
      .post({
        body: {
          query: baseQuery,
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

    const products = mapSearchResultsToCards(
      searchResponse.body.results || [],
      language
    )

    return {
      products,
      total: searchResponse.body.total ?? products.length,
    }
  }
}
