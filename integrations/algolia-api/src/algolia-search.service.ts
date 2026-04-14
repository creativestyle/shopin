import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  DEFAULT_SUGGESTION_LIMIT,
} from '@config/constants'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from '@core/contracts/product-search/search-provider'
import { SUGGESTION_FETCH_SIZE } from '@core/contracts/product-search/search-provider'
import { extractQuerySuggestions } from '@core/contracts/product-search/suggestion-utils'
import type { AlgoliaClient } from './create-algolia-client'
import type { SearchResponse } from './create-algolia-client'
import {
  type AlgoliaProductHit,
  mapAlgoliaHitToProduct,
} from './mappers/algolia-hit-to-product'
import {
  type AttributeMetadata,
  mapAlgoliaFacets,
  mergeAlgoliaFacets,
} from './mappers/algolia-facets'
import { mapAlgoliaPriceRange } from './mappers/algolia-price-range'
import {
  buildAlgoliaFieldNames,
  buildFacetAttributeNames,
  buildAlgoliaFacetFilters,
  buildAlgoliaNumericFilters,
} from './mappers/algolia-query-utils'

const METADATA_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export class AlgoliaSearchService implements SearchProvider {
  private attributeMetadataCache: AttributeMetadata[] | null = null
  private attributeMetadataCachedAt = 0

  constructor(
    private readonly client: AlgoliaClient,
    private readonly indexName: string
  ) {}

  private async getAttributeMetadata(): Promise<AttributeMetadata[]> {
    if (
      this.attributeMetadataCache &&
      Date.now() - this.attributeMetadataCachedAt < METADATA_CACHE_TTL_MS
    ) {
      return this.attributeMetadataCache
    }

    const settings = await this.client.getSettings({
      indexName: this.indexName,
    })
    const userData = settings.userData as
      | { filterableAttributes?: AttributeMetadata[] }
      | undefined
    this.attributeMetadataCache = userData?.filterableAttributes ?? []
    this.attributeMetadataCachedAt = Date.now()
    return this.attributeMetadataCache
  }

  async getSuggestions(
    query: string,
    language: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT
  ): Promise<string[]> {
    const { nameAttr } = buildAlgoliaFieldNames(language)

    const response: SearchResponse<AlgoliaProductHit> =
      await this.client.searchSingleIndex({
        indexName: this.indexName,
        searchParams: {
          query,
          hitsPerPage: SUGGESTION_FETCH_SIZE,
          attributesToRetrieve: [nameAttr],
          attributesToHighlight: [],
          restrictSearchableAttributes: [nameAttr],
          typoTolerance: false,
        },
      })

    const names = response.hits
      .map((hit) => hit[nameAttr])
      .filter((name): name is string => typeof name === 'string')

    return extractQuerySuggestions(names, query, limit)
  }

  async searchProducts({
    query,
    language,
    limit = ITEMS_PER_PAGE,
    page = MIN_PAGE,
    filters,
    priceMin,
    priceMax,
    saleOnly,
  }: SearchProductsOptions): Promise<SearchProductsResult> {
    const { langKey, nameAttr, priceField, discountedPriceField } =
      buildAlgoliaFieldNames(language)

    const attributeMetadata = await this.getAttributeMetadata()
    const facetAttrNames = buildFacetAttributeNames(attributeMetadata, langKey)

    const facetFilters = buildAlgoliaFacetFilters(
      filters,
      attributeMetadata,
      langKey
    )
    const numericFilters = buildAlgoliaNumericFilters(
      priceField,
      discountedPriceField,
      priceMin,
      priceMax,
      saleOnly
    )

    const hasActiveFilters =
      facetFilters.length > 0 || numericFilters.length > 0

    const mainQuery = this.client.searchSingleIndex<AlgoliaProductHit>({
      indexName: this.indexName,
      searchParams: {
        query,
        hitsPerPage: limit,
        page: page - 1, // Algolia is 0-indexed
        restrictSearchableAttributes: [nameAttr],
        typoTolerance: false,
        facets: facetAttrNames,
        ...(facetFilters.length > 0 && { facetFilters }),
        ...(numericFilters.length > 0 && { numericFilters }),
      },
    })

    const unfilteredQuery = hasActiveFilters
      ? this.client.searchSingleIndex<AlgoliaProductHit>({
          indexName: this.indexName,
          searchParams: {
            query,
            hitsPerPage: 0,
            restrictSearchableAttributes: [nameAttr],
            typoTolerance: false,
            facets: facetAttrNames,
          },
        })
      : Promise.resolve(null)

    const [response, unfiltered, priceRange] = await Promise.all([
      mainQuery,
      unfilteredQuery,
      this.getPriceRange(
        query,
        nameAttr,
        priceField,
        facetFilters,
        numericFilters
      ),
    ])

    const allFacets =
      hasActiveFilters && unfiltered
        ? mergeAlgoliaFacets(unfiltered.facets, response.facets)
        : response.facets

    const products = response.hits.map((hit) =>
      mapAlgoliaHitToProduct(hit, language)
    )
    const facets = mapAlgoliaFacets(allFacets, attributeMetadata, language)

    return {
      products,
      facets,
      priceRange,
      total: response.nbHits ?? 0,
    }
  }

  private async getPriceRange(
    query: string,
    nameAttr: string,
    priceField: string,
    facetFilters: string[][],
    numericFilters: string[]
  ): Promise<PriceRange | undefined> {
    const priceNumericFilters = numericFilters.filter(
      (f) => !f.includes(priceField)
    )

    const statsResponse: SearchResponse<AlgoliaProductHit> =
      await this.client.searchSingleIndex({
        indexName: this.indexName,
        searchParams: {
          query,
          hitsPerPage: 0,
          restrictSearchableAttributes: [nameAttr],
          typoTolerance: false,
          facets: [priceField],
          ...(facetFilters.length > 0 && { facetFilters }),
          ...(priceNumericFilters.length > 0 && {
            numericFilters: priceNumericFilters,
          }),
        },
      })

    return mapAlgoliaPriceRange(statsResponse, priceField)
  }
}
