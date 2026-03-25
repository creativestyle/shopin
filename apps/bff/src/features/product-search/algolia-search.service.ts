import { Injectable } from '@nestjs/common'
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
} from '@integrations/algolia-api'

@Injectable()
export class AlgoliaSearchService implements SearchProvider {
  private client: ReturnType<typeof algoliasearch> | null = null
  private indexName = ''
  private attributeMetadataCache: AttributeMetadata[] | null = null

  constructor(private readonly configService: ConfigService) {}

  private getClient(): ReturnType<typeof algoliasearch> {
    if (!this.client) {
      const appId = this.configService.getOrThrow<string>('ALGOLIA_APP_ID')
      const searchApiKey = this.configService.getOrThrow<string>(
        'ALGOLIA_SEARCH_API_KEY'
      )
      this.indexName =
        this.configService.getOrThrow<string>('ALGOLIA_INDEX_NAME')
      this.client = algoliasearch(appId, searchApiKey)
    }
    return this.client
  }

  private async getAttributeMetadata(): Promise<AttributeMetadata[]> {
    if (this.attributeMetadataCache) {return this.attributeMetadataCache}

    const settings = await this.getClient().getSettings({
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
    limit: number = 10
  ): Promise<string[]> {
    const nameAttr = `name_${language.replace('-', '_')}`

    const response: SearchResponse<AlgoliaProductHit> =
      await this.getClient().searchSingleIndex({
        indexName: this.indexName,
        searchParams: {
          query,
          hitsPerPage: limit,
          attributesToRetrieve: [nameAttr],
          attributesToHighlight: [],
          restrictSearchableAttributes: [nameAttr],
          typoTolerance: false,
        },
      })

    const seen = new Set<string>()
    const suggestions: string[] = []

    for (const hit of response.hits) {
      const name = hit[nameAttr]
      if (typeof name !== 'string') {continue}
      const lower = name.toLowerCase()
      if (seen.has(lower)) {continue}
      seen.add(lower)
      suggestions.push(lower)
    }

    return suggestions
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
    const langKey = language.replace('-', '_')
    const nameAttr = `name_${langKey}`
    const priceField = `price_${langKey}_centAmount`
    const discountedPriceField = `price_${langKey}_discountedCentAmount`

    const attributeMetadata = await this.getAttributeMetadata()
    // ltext attributes are stored per-language; enum/text are language-independent
    const facetAttrNames = attributeMetadata.map((a) =>
      a.fieldType === 'ltext' ? `attr_${a.name}_${langKey}` : `attr_${a.name}`
    )

    // Build facet filters from the filters object
    const facetFilters: string[][] = []
    if (filters) {
      for (const [attrName, values] of Object.entries(filters)) {
        if (values.length > 0) {
          const meta = attributeMetadata.find((a) => a.name === attrName)
          const algoliaKey =
            meta?.fieldType === 'ltext'
              ? `attr_${attrName}_${langKey}`
              : `attr_${attrName}`
          // Values within the same attribute are OR'd
          facetFilters.push(values.map((v) => `${algoliaKey}:${v}`))
        }
      }
    }

    // Build numeric filters for price range and sale-only
    const numericFilters: string[] = []
    if (priceMin !== undefined) {
      numericFilters.push(`${priceField} >= ${priceMin}`)
    }
    if (priceMax !== undefined) {
      numericFilters.push(`${priceField} <= ${priceMax}`)
    }
    if (saleOnly) {
      numericFilters.push(`${discountedPriceField} > 0`)
    }

    // Build sort (index sorting in Algolia requires replicas; use built-in relevance for now)
    // For price sorting, we can use Algolia's custom ranking or replicas in the future

    const hasActiveFilters =
      facetFilters.length > 0 || numericFilters.length > 0

    const response: SearchResponse<AlgoliaProductHit> =
      await this.getClient().searchSingleIndex({
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
        await this.getClient().searchSingleIndex({
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

    const products = response.hits.map((hit) =>
      mapAlgoliaHitToProduct(hit, language, langKey)
    )

    const facets = mapAlgoliaFacets(allFacets, attributeMetadata, language)

    const priceRange = await this.getPriceRange(
      query,
      nameAttr,
      priceField,
      facetFilters,
      numericFilters
    )

    return {
      products,
      facets,
      priceRange,
      total: response.nbHits,
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
      await this.getClient().searchSingleIndex({
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
