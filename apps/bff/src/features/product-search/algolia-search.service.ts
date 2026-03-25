import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { algoliasearch, type SearchResponse } from 'algoliasearch'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { Facet, FacetTerm, FacetDisplayType } from '@core/contracts/product-collection/facet'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from './search-provider.interface'

interface AlgoliaProductHit {
  objectID: string
  name_en_US?: string
  name_de_DE?: string
  slug?: Record<string, string>
  variantId?: string
  variantCount?: number
  imageUrl?: string
  imageAlt?: string
  [key: string]: unknown
}

interface AttributeMetadata {
  name: string
  label: Record<string, string>
  fieldType: string
}

const KNOWN_SIZES = new Set([
  'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL',
])
const SIZE_PATTERN = /^\d{1,3}$/
const CSS_COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgb\(|hsl\()/i
const COLOR_PAIR_HEX_PATTERN = /[:=]\s*#[0-9a-f]{3,8}$/i
const CSS_COLOR_KEYWORDS = new Set([
  'transparent', 'currentcolor',
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'gray', 'grey', 'pink', 'brown', 'cyan', 'magenta', 'lime', 'olive',
  'navy', 'teal', 'aqua', 'fuchsia', 'maroon', 'silver',
  'beige', 'coral', 'crimson', 'gold', 'indigo', 'ivory', 'khaki',
  'lavender', 'linen', 'plum', 'salmon', 'sienna', 'tan', 'tomato',
  'turquoise', 'violet', 'wheat',
])

function isColorValue(value: string): boolean {
  return CSS_COLOR_PATTERN.test(value) || CSS_COLOR_KEYWORDS.has(value.toLowerCase())
}

function isColorTerm(term: string): boolean {
  if (isColorValue(term)) return true
  if (COLOR_PAIR_HEX_PATTERN.test(term)) return true
  const sepMatch = term.match(/[:=]\s*(.+)$/)
  if (sepMatch?.[1] && isColorValue(sepMatch[1].trim())) return true
  return false
}

function inferDisplayType(terms: FacetTerm[]): FacetDisplayType {
  if (terms.every((t) => isColorTerm(t.term))) {
    return 'color'
  }
  if (terms.every((t) => KNOWN_SIZES.has(t.term.toUpperCase()) || SIZE_PATTERN.test(t.term))) {
    return 'size'
  }
  return 'text'
}

function extractColorHex(term: string): string | undefined {
  const pairMatch = term.match(/[:=]\s*(#[0-9a-f]{3,8})$/i)
  if (pairMatch) return pairMatch[1]
  if (/^#[0-9a-f]{3,8}$/i.test(term)) return term
  const sepMatch = term.match(/[:=]\s*(.+)$/)
  if (sepMatch?.[1]) {
    const val = sepMatch[1].trim().toLowerCase()
    if (CSS_COLOR_KEYWORDS.has(val)) return val
  }
  return undefined
}

function stripColorSuffix(label: string): string {
  const hexStripped = label.replace(/\s*[:=]\s*#[0-9a-f]{3,8}$/i, '').trim()
  if (hexStripped !== label) return hexStripped
  const sepMatch = label.match(/^(.*?)\s*[:=]\s*(.+)$/)
  if (sepMatch?.[1] && sepMatch[2]) {
    const val = sepMatch[2].trim().toLowerCase()
    if (CSS_COLOR_KEYWORDS.has(val)) return sepMatch[1].trim()
  }
  return label.trim()
}

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
    if (this.attributeMetadataCache) return this.attributeMetadataCache

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
      if (typeof name !== 'string') continue
      const lower = name.toLowerCase()
      if (seen.has(lower)) continue
      seen.add(lower)
      suggestions.push(lower)
    }

    return suggestions
  }

  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const { query, language, limit = 24, page = 1, filters, priceMin, priceMax, sort, saleOnly } = options
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
          const algoliaKey = meta?.fieldType === 'ltext'
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

    const hasActiveFilters = facetFilters.length > 0 || numericFilters.length > 0

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
      allFacets = this.mergeFacets(unfiltered.facets, response.facets)
    }

    const products = response.hits.map((hit) => this.mapHitToProduct(hit, language, langKey))

    // Map Algolia facets to our Facet contract
    const facets = this.mapFacets(allFacets, attributeMetadata, language)

    // Extract price range from hits or use a separate stats query
    const priceRange = await this.getPriceRange(query, nameAttr, priceField, facetFilters, numericFilters)

    return {
      products,
      facets,
      priceRange,
      total: response.nbHits,
    }
  }

  private mapHitToProduct(
    hit: AlgoliaProductHit,
    language: string,
    langKey: string
  ): ProductCardResponse {
    const nameAttr = `name_${langKey}`
    const pricePrefix = `price_${langKey}`
    const slug = hit.slug as Record<string, string> | undefined
    const slugStr =
      (slug && typeof slug === 'object' ? slug[language] : undefined) ||
      hit.objectID

    return {
      id: hit.objectID,
      name: (hit[nameAttr] as string) || 'Unnamed Product',
      slug: slugStr,
      image: {
        src: (hit.imageUrl as string) || '/images/product-image.png',
        alt: (hit.imageAlt as string) || 'Product image',
      },
      price: {
        regularPriceInCents:
          (hit[`${pricePrefix}_centAmount`] as number) || 0,
        ...(hit[`${pricePrefix}_currency`] != null && {
          currency: hit[`${pricePrefix}_currency`] as string,
        }),
        fractionDigits:
          (hit[`${pricePrefix}_fractionDigits`] as number) ?? 2,
        ...(hit[`${pricePrefix}_discountedCentAmount`] != null && {
          discountedPriceInCents: hit[
            `${pricePrefix}_discountedCentAmount`
          ] as number,
        }),
        ...(hit[`${pricePrefix}_rrpCentAmount`] != null && {
          recommendedRetailPriceInCents: hit[
            `${pricePrefix}_rrpCentAmount`
          ] as number,
        }),
        ...(hit[`${pricePrefix}_omnibusCentAmount`] != null && {
          omnibusPriceInCents: hit[
            `${pricePrefix}_omnibusCentAmount`
          ] as number,
        }),
      },
      variantId: (hit.variantId as string) || '1',
      variantCount: (hit.variantCount as number) || 1,
    }
  }

  private mapFacets(
    algoliaFacets: Record<string, Record<string, number>> | undefined,
    attributeMetadata: AttributeMetadata[],
    language: string
  ): Facet[] {
    if (!algoliaFacets) return []

    const facets: Facet[] = []
    const langKey = language.replace('-', '_')
    for (const attr of attributeMetadata) {
      const facetKey = attr.fieldType === 'ltext'
        ? `attr_${attr.name}_${langKey}`
        : `attr_${attr.name}`
      const facetCounts = algoliaFacets[facetKey]
      if (!facetCounts || Object.keys(facetCounts).length === 0) continue

      const rawTerms: FacetTerm[] = Object.entries(facetCounts).map(
        ([term, count]) => ({
          term,
          label: term,
          count,
        })
      )

      const displayType = inferDisplayType(rawTerms)

      const terms: FacetTerm[] =
        displayType === 'color'
          ? rawTerms.map((t) => ({
              ...t,
              label: stripColorSuffix(t.label),
              colorHex: extractColorHex(t.term),
            }))
          : rawTerms

      const label = attr.label[language] ?? attr.label['en-US'] ?? attr.name

      facets.push({ name: attr.name, label, displayType, terms })
    }

    return facets
  }

  private async getPriceRange(
    query: string,
    nameAttr: string,
    priceField: string,
    facetFilters: string[][],
    numericFilters: string[]
  ): Promise<PriceRange | undefined> {
    // Use a separate query with hitsPerPage=0 to get min/max price without fetching products
    // We remove price numeric filters to get the full range
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

    const stats = (statsResponse as any).facets_stats?.[priceField]
    if (!stats) return undefined

    return {
      minPriceInCents: Math.floor(stats.min),
      maxPriceInCents: Math.ceil(stats.max),
    }
  }

  /**
   * Merge facets: use all options from the unfiltered query, but replace
   * counts with those from the filtered query (0 when the option is absent).
   */
  private mergeFacets(
    allOptions: Record<string, Record<string, number>> | undefined,
    filteredCounts: Record<string, Record<string, number>> | undefined
  ): Record<string, Record<string, number>> | undefined {
    if (!allOptions) return filteredCounts
    if (!filteredCounts) return allOptions

    const merged: Record<string, Record<string, number>> = {}
    for (const [facetKey, options] of Object.entries(allOptions)) {
      const filtered = filteredCounts[facetKey] ?? {}
      merged[facetKey] = {}
      for (const term of Object.keys(options)) {
        merged[facetKey][term] = filtered[term] ?? 0
      }
    }
    return merged
  }
}
