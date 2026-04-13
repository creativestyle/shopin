import { Injectable, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { algoliasearch, type SearchResponse } from 'algoliasearch'
import { ITEMS_PER_PAGE, MIN_PAGE } from '@config/constants'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from './search-provider.interface'
import {
  type AlgoliaProductHit,
  mapAlgoliaHitToProduct,
  type AttributeMetadata,
  mapAlgoliaFacets,
  mergeAlgoliaFacets,
  mapAlgoliaPriceRange,
  buildAlgoliaFieldNames,
  buildFacetAttributeNames,
  buildAlgoliaFacetFilters,
  buildAlgoliaNumericFilters,
} from '@integrations/algolia-api'
import { extractQuerySuggestions } from './suggestion-utils'
import { SUGGESTION_FETCH_SIZE } from './search-provider.interface'
import { DEFAULT_SUGGESTION_LIMIT } from '@config/constants'

const METADATA_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

@Injectable()
export class AlgoliaSearchService implements SearchProvider, OnModuleInit {
  private client!: ReturnType<typeof algoliasearch>
  private indexName = ''
  private attributeMetadataCache: AttributeMetadata[] | null = null
  private attributeMetadataCachedAt = 0

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const appId = this.configService.getOrThrow<string>('ALGOLIA_APP_ID')
    const searchApiKey = this.configService.getOrThrow<string>(
      'ALGOLIA_SEARCH_API_KEY'
    )
    this.indexName = this.configService.getOrThrow<string>('ALGOLIA_INDEX_NAME')
    this.client = algoliasearch(appId, searchApiKey)
  }

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

    // When filters are active, run a second query WITHOUT filters to get all
    // available facet options (mirroring CT's postFilter / dual-query pattern).
    // The filtered query's counts are merged into the full option set.
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
