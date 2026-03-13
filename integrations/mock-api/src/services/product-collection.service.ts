import { Injectable, Inject } from '@nestjs/common'
import { MOCK_API, MockApi } from '../client/client.module'
import { LANGUAGE_TOKEN, resolveCurrencyFromLanguage } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductCollectionResponse } from '@core/contracts/product-collection/product-collection'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'
import { generateSeed } from '../helpers/generateSeed'
import {
  createShopinProductCardList,
  generateMockCategoryTree,
  buildFacetsFromProducts,
  type ProductCardWithAttributes,
} from '../generators'

@Injectable()
export class ProductCollectionService {
  constructor(
    @Inject(MOCK_API) private readonly mockApi: MockApi,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

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

        // Exact match since values include format like "White:#FFFFFF"
        const matches = values.some((v) => v === productValue)
        if (!matches) {
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

  async getProductCollection(
    productCollectionSlug: string,
    page: number = MIN_PAGE,
    limit: number = ITEMS_PER_PAGE,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sort: SortOption = DEFAULT_SORT_OPTION,
    filters?: Filters,
    saleOnly: boolean = false,
    priceMin?: number,
    priceMax?: number
  ): Promise<ProductCollectionResponse> {
    const faker = this.mockApi.getFaker()
    faker.seed(generateSeed(productCollectionSlug))
    const category = faker.commerce.department()
    const generatedCategorySlug = faker.helpers
      .slugify(category)
      .toLocaleLowerCase()
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)

    faker.seed(generateSeed(`${productCollectionSlug}-categories`))
    const { categoryTree, currentCategoryId } = generateMockCategoryTree(
      faker,
      generatedCategorySlug,
      category
    )

    faker.seed(generateSeed(`${productCollectionSlug}-all`))
    const allProducts = createShopinProductCardList(faker, 100)

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

    const total = filteredProducts.length

    const offset = (page - 1) * limit
    const paginatedProducts = filteredProducts.slice(offset, offset + limit)

    const productList = paginatedProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: { ...p.price, currency },
      image: p.image,
    }))

    return {
      productList,
      breadcrumb: [{ label: category, path: `/c/${generatedCategorySlug}` }],
      total,
      facets,
      priceRange,
      categoryTree,
      currentCategoryId,
    }
  }
}
