import type {
  SearchSorting,
  _SearchQuery,
  ProductSearchFacetExpression,
} from '@commercetools/platform-sdk'
import type { Client } from '../client/client.module'
import type { Facet } from '@core/contracts/product-collection/facet'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import {
  mapFacetsFromResponse,
  extractPriceRange,
  mergeFacetCounts,
  type FilterableAttribute,
} from '../mappers/product-collection'
import { mapSearchResultsToCards } from '../mappers/search-results'

export interface FacetedSearchParams {
  client: Client
  baseQuery: _SearchQuery
  countQuery: _SearchQuery
  hasActiveFilters: boolean
  postFilters: _SearchQuery[]
  facets: ProductSearchFacetExpression[]
  sortExpressions: SearchSorting[]
  language: string
  currency: string
  country: string
  limit: number
  offset: number
  filterableAttributes: FilterableAttribute[]
}

export interface FacetedSearchResult {
  products: ProductCardResponse[]
  facets: Facet[]
  priceRange: PriceRange | undefined
  total: number
}

export async function executeFacetedSearch(
  params: FacetedSearchParams
): Promise<FacetedSearchResult> {
  const {
    client,
    baseQuery,
    countQuery,
    hasActiveFilters,
    postFilters,
    facets,
    sortExpressions,
    language,
    currency,
    country,
    limit,
    offset,
    filterableAttributes,
  } = params

  const mainSearchPromise = client
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
          localeProjection: [language],
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

  const countsPromise = hasActiveFilters
    ? client
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

  const results = searchResponse.body.results || []
  const total = searchResponse.body.total ?? 0

  return {
    products: mapSearchResultsToCards(results, language),
    facets: mapFacetsFromResponse(facetResults, filterableAttributes, language),
    priceRange: extractPriceRange(facetResults),
    total,
  }
}
