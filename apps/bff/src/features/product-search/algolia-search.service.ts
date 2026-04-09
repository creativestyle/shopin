import { Injectable, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { algoliasearch, type SearchResponse } from 'algoliasearch'
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
import {
  DEFAULT_SUGGESTION_LIMIT,
  SUGGESTION_FETCH_SIZE,
} from './search-provider.interface'

@Injectable()
export class AlgoliaSearchService implements SearchProvider, OnModuleInit {
  private client!: ReturnType<typeof algoliasearch>
  private indexName = ''
  private attributeMetadataCache: AttributeMetadata[] | null = null

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
    if (this.attributeMetadataCache) {
      return this.attributeMetadataCache
    }

    const settings = await this.client.getSettings({
      indexName: this.indexName,
    })
    const userData = settings.userData as
      | { filterableAttributes?: AttributeMetadata[] }
      | undefined
    this.attributeMetadataCache = userData?.filterableAttributes ?? []
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

  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const {
      query,
      language,
      limit = 24,
      page = 1,
      filters,
      priceMin,
      priceMax,
      saleOnly,
    } = options
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

    const response: SearchResponse<AlgoliaProductHit> =
      await this.client.searchSingleIndex({
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
    let allFacets = response.facets
    if (hasActiveFilters) {
      const unfiltered: SearchResponse<AlgoliaProductHit> =
        await this.client.searchSingleIndex({
          indexName: this.indexName,
          searchParams: {
            query,
            hitsPerPage: 0,
            restrictSearchableAttributes: [nameAttr],
            typoTolerance: false,
            facets: facetAttrNames,
          },
        })
      allFacets = mergeAlgoliaFacets(unfiltered.facets, response.facets)
    }

    const [products, facets, priceRange] = await Promise.all([
      response.hits.map((hit) => mapAlgoliaHitToProduct(hit, language)),
      mapAlgoliaFacets(allFacets, attributeMetadata, language),
      this.getPriceRange(
        query,
        nameAttr,
        priceField,
        facetFilters,
        numericFilters
      ),
    ])

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
