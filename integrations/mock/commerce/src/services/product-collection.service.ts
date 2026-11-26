import { RequestContext } from '@core/integration-kit'
import { Injectable, Inject } from '@nestjs/common'
import { MOCK_API, MockApi } from '../client/client.module'
import { resolveCurrencyFromLanguage } from '@core/i18n'
import type { ProductCollectionResponse } from '@core/contracts/product-collection/product-collection'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import {
  buildCategoryPath,
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
  withShopinVariantSummary,
} from '../generators'
import {
  calculatePriceRange,
  filterProductCards,
} from '../helpers/product-card-filters'

@Injectable()
export class ProductCollectionService {
  constructor(
    @Inject(MOCK_API) private readonly mockApi: MockApi,
    private readonly languageProvider: RequestContext
  ) {}

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

    const priceRange = calculatePriceRange(allProducts)
    const filteredProducts = filterProductCards(allProducts, {
      filters,
      saleOnly,
      priceMin,
      priceMax,
    })

    const facets = buildFacetsFromProducts(allProducts, filteredProducts)

    const total = filteredProducts.length

    const offset = (page - 1) * limit
    const paginatedProducts = withShopinVariantSummary(
      faker,
      filteredProducts.slice(offset, offset + limit)
    )

    const productList = paginatedProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price && { ...p.price, currency },
      image: p.image,
      variantId: p.variantId,
      variantCount: p.variantCount,
      // the catalog record's attributes: stripped by the contract, read by a shop's mapper hook
      attributes: p.attributes,
    }))

    return {
      productList,
      breadcrumb: [
        { label: category, path: buildCategoryPath(generatedCategorySlug) },
      ],
      total,
      facets,
      priceRange,
      categoryTree,
      currentCategoryId,
    }
  }
}
