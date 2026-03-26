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
import { mapProductToCard } from '../mappers/product-card'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'
import {
  buildPostFilters,
  buildFacets,
  buildSortExpressions,
  buildAttributeFilters,
} from '../helpers/product-collection-filters'
import {
  mapFacetsFromResponse,
  extractPriceRange,
  mapFilterableAttributes,
  mergeFacetCounts,
  filterSaleOnlyResults,
  type FilterableAttribute,
} from '../mappers/product-collection'

const DEFAULT_SEARCH_LIMIT = 4

@Injectable()
export class ProductSearchService {
  private filterableAttributesCache: FilterableAttribute[] | null = null

  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  private async getFilterableAttributes(): Promise<FilterableAttribute[]> {
    if (this.filterableAttributesCache) {
      return this.filterableAttributesCache
    }

    const response = await this.client
      .productTypes()
      .get({ queryArgs: { limit: 100 } })
      .execute()

    this.filterableAttributesCache = mapFilterableAttributes(
      response.body.results
    )
    return this.filterableAttributesCache
  }

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
    const filterableAttributes = await this.getFilterableAttributes()
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

    // Main query with postFilter for faceted navigation UX
    const mainSearchPromise = this.client
      .products()
      .search()
      .post({
        body: {
          query: baseQuery,
          ...(postFilters.length > 0 && {
            postFilter:
              postFilters.length === 1 ? postFilters[0] : { and: postFilters },
          }),
          productProjectionParameters: {
            localeProjection: [currentLanguage],
            priceCurrency: currency,
            priceCountry: country,
            staged: false,
          },
          facets,
          sort: sortExpressions,
          limit,
          offset,
        },
      })
      .execute()

    // Second facet-only query for accurate counts when filters are active
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

    const countsPromise = hasActiveFilters
      ? this.client
          .products()
          .search()
          .post({
            body: {
              query: countQuery,
              facets,
              limit: 0,
            },
          })
          .execute()
      : Promise.resolve(null)

    const [searchResponse, countsResponse] = await Promise.all([
      mainSearchPromise,
      countsPromise,
    ])

    const facetResults = mergeFacetCounts(
      searchResponse.body.facets,
      countsResponse?.body.facets
    )

    const rawResults = searchResponse.body.results || []
    const results = saleOnly ? filterSaleOnlyResults(rawResults) : rawResults
    const total = saleOnly
      ? (countsResponse?.body.total ?? searchResponse.body.total ?? 0)
      : searchResponse.body.total || 0

    return {
      suggestions: [],
      products: results
        .filter((r) => r.productProjection)
        .map((r) =>
          mapProductToCard(
            r.productProjection as unknown as ProductProjectionApiResponse,
            currentLanguage
          )
        ),
      facets: mapFacetsFromResponse(
        facetResults,
        filterableAttributes,
        currentLanguage
      ),
      priceRange: extractPriceRange(facetResults),
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

    const products = (searchResponse.body.results || [])
      .filter((r) => r.productProjection)
      .map((r) =>
        mapProductToCard(
          r.productProjection as unknown as ProductProjectionApiResponse,
          language
        )
      )

    return {
      suggestions: [],
      products,
    }
  }
}
