import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { algoliasearch, type SearchResponse } from 'algoliasearch'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { SearchProvider } from './search-provider.interface'

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

@Injectable()
export class AlgoliaSearchService implements SearchProvider {
  private client: ReturnType<typeof algoliasearch> | null = null
  private indexName = ''

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
    query: string,
    language: string,
    limit: number = 4
  ): Promise<ProductCardResponse[]> {
    const langKey = language.replace('-', '_')
    const nameAttr = `name_${langKey}`
    const pricePrefix = `price_${langKey}`

    const response: SearchResponse<AlgoliaProductHit> =
      await this.getClient().searchSingleIndex({
        indexName: this.indexName,
        searchParams: {
          query,
          hitsPerPage: limit,
          restrictSearchableAttributes: [nameAttr],
          typoTolerance: false,
        },
      })

    return response.hits.map((hit) => {
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
    })
  }
}
