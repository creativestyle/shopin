import { Injectable, Inject } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import {
  LANGUAGE_TOKEN,
  resolveCurrencyFromLanguage,
  resolveCountryFromLanguage,
} from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import {
  DEFAULT_SORT_OPTION,
  MIN_PAGE,
  type SortOption,
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

const DEFAULT_SEARCH_LIMIT = 4

@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly filterableAttributesCache: FilterableAttributesCacheService
  ) {}

  private buildTextQuery(
    query: string,
    language: string,
    saleOnly: boolean
  ): { baseQuery: object; textQuery: object } {
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

    if (saleOnly) {
      return {
        textQuery,
        baseQuery: {
          and: [textQuery, { exists: { field: 'variants.prices.discounted' } }],
        },
      }
    }

    return { textQuery, baseQuery: textQuery }
  }

  async searchProducts(
    query: string,
    limit: number = DEFAULT_SEARCH_LIMIT,
    page: number = MIN_PAGE,
    filters?: Filters,
    priceMin?: number,
    priceMax?: number,
    sort: SortOption = DEFAULT_SORT_OPTION,
    saleOnly: boolean = false
  ): Promise<ProductSearchResponse> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)
    const offset = (page - 1) * limit

    const hasFacetedSearch =
      filters !== undefined ||
      priceMin !== undefined ||
      priceMax !== undefined ||
      page > MIN_PAGE ||
      limit > DEFAULT_SEARCH_LIMIT

    // Simple search (popup) — no facets/filters needed
    if (!hasFacetedSearch && !saleOnly) {
      return this.simpleSearch(query, limit, currentLanguage, currency, country)
    }

    // Full faceted search (results page)
    const filterableAttributes =
      await this.filterableAttributesCache.getFilterableAttributes()
    const { baseQuery, textQuery } = this.buildTextQuery(
      query,
      currentLanguage,
      saleOnly
    )

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

    const countQueryParts = saleOnly
      ? [
          textQuery,
          { exists: { field: 'variants.prices.discounted' } },
          ...attributeFilters,
        ]
      : [textQuery, ...attributeFilters]
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
      saleOnly,
      filterableAttributes,
    })

    return {
      suggestions: [],
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
    const { baseQuery } = this.buildTextQuery(query, language, false)

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
      suggestions: [],
      products,
    }
  }
}
