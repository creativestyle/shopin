import { Injectable, Inject } from '@nestjs/common'
import { MOCK_API, MockApi } from '../client/client.module'
import { resolveCurrencyFromLanguage } from '@core/i18n'
import {
  DEFAULT_SUGGESTION_LIMIT,
  ITEMS_PER_PAGE,
  MIN_PAGE,
} from '@config/constants'
import type {
  SearchProvider,
  SearchProductsOptions,
  SearchProductsResult,
} from '@core/contracts/product-search/search-provider'
import { extractQuerySuggestions } from '@core/contracts/product-search/suggestion-utils'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import { generateSeed } from '../helpers/generateSeed'
import {
  createShopinProductCardList,
  buildFacetsFromProducts,
  type ProductCardWithAttributes,
} from '../generators'

const MIN_MATCH_COUNT = 8
const MAX_MATCH_COUNT = 60

@Injectable()
export class SearchService implements SearchProvider {
  constructor(@Inject(MOCK_API) private readonly mockApi: MockApi) {}

  /** Deterministic per query, so repeated searches and suggestions stay in sync. */
  private generateMatches(query: string): ProductCardWithAttributes[] {
    const term = query.trim()
    if (!term) {
      return []
    }

    const faker = this.mockApi.getFaker()
    faker.seed(generateSeed(`search-${term.toLocaleLowerCase()}`))

    const count = faker.number.int({
      min: MIN_MATCH_COUNT,
      max: MAX_MATCH_COUNT,
    })
    const label = term.charAt(0).toLocaleUpperCase() + term.slice(1)

    return createShopinProductCardList(faker, count).map((product) => {
      const name = `${faker.commerce.productAdjective()} ${label} ${faker.commerce.product()}`
      return {
        ...product,
        name,
        slug: faker.helpers.slugify(name).toLocaleLowerCase(),
        image: { ...product.image, alt: name },
      }
    })
  }

  private applyFilters(
    products: ProductCardWithAttributes[],
    filters?: Filters
  ): ProductCardWithAttributes[] {
    if (!filters) {
      return products
    }

    return products.filter((product) => {
      for (const [attrName, values] of Object.entries(filters)) {
        if (!values || values.length === 0) {
          continue
        }

        const productValue =
          product.attributes[attrName as keyof typeof product.attributes]
        if (!productValue) {
          continue
        }

        if (!values.some((v) => v === productValue)) {
          return false
        }
      }
      return true
    })
  }

  private getEffectivePrice(product: ProductCardWithAttributes): number {
    return (
      product.price.discountedPriceInCents ?? product.price.regularPriceInCents
    )
  }

  private calculatePriceRange(products: ProductCardWithAttributes[]): {
    minPriceInCents: number
    maxPriceInCents: number
  } {
    if (products.length === 0) {
      return { minPriceInCents: 0, maxPriceInCents: 0 }
    }
    const prices = products.map((p) => this.getEffectivePrice(p))
    return {
      minPriceInCents: Math.min(...prices),
      maxPriceInCents: Math.max(...prices),
    }
  }

  // Sort is ignored, matching ProductCollectionService.
  async searchProducts(
    options: SearchProductsOptions
  ): Promise<SearchProductsResult> {
    const {
      query,
      language,
      limit = ITEMS_PER_PAGE,
      page = MIN_PAGE,
      filters,
      priceMin,
      priceMax,
      saleOnly,
    } = options

    const allProducts = this.generateMatches(query)
    if (allProducts.length === 0) {
      return { products: [], facets: [], total: 0 }
    }

    const currency = resolveCurrencyFromLanguage(language)
    const priceRange = this.calculatePriceRange(allProducts)

    let filteredProducts = this.applyFilters(allProducts, filters)

    if (saleOnly) {
      filteredProducts = filteredProducts.filter(
        (product) => product.price.discountedPriceInCents !== undefined
      )
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      filteredProducts = filteredProducts.filter((product) => {
        const price = this.getEffectivePrice(product)
        if (priceMin !== undefined && price < priceMin) {
          return false
        }
        if (priceMax !== undefined && price > priceMax) {
          return false
        }
        return true
      })
    }

    const facets = buildFacetsFromProducts(allProducts, filteredProducts)
    const offset = (page - 1) * limit

    return {
      products: filteredProducts.slice(offset, offset + limit).map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: { ...p.price, currency },
        image: p.image,
      })),
      facets,
      priceRange,
      total: filteredProducts.length,
    }
  }

  async getSuggestions(
    query: string,
    _language: string,
    limit: number = DEFAULT_SUGGESTION_LIMIT
  ): Promise<string[]> {
    const names = this.generateMatches(query).map((p) => p.name)
    return extractQuerySuggestions(names, query, limit)
  }
}
