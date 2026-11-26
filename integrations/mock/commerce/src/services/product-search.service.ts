import { Injectable, Inject } from '@nestjs/common'
import { RequestContext } from '@core/integration-kit'
import { resolveCurrencyFromLanguage } from '@core/i18n'
import { ITEMS_PER_PAGE, MIN_PAGE } from '@config/constants'
import type { ProductSearchParams } from '@core/contracts/core/data-source-interfaces'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import { MOCK_API, MockApi } from '../client/client.module'
import { generateSeed } from '../helpers/generateSeed'
import {
  createShopinProductCardList,
  buildFacetsFromProducts,
  withShopinVariantSummary,
  type ProductCardWithAttributes,
} from '../generators'
import {
  calculatePriceRange,
  filterProductCards,
} from '../helpers/product-card-filters'

const MIN_MATCH_COUNT = 8
const MAX_MATCH_COUNT = 60

/**
 * The mock catalog's product search: a deterministic set of matches per query, filtered, faceted and paged like
 * the category pages. Search integrations reach it through the commerce port (search served by commerce).
 */
@Injectable()
export class ProductSearchService {
  constructor(
    @Inject(MOCK_API) private readonly mockApi: MockApi,
    private readonly languageProvider: RequestContext
  ) {}

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

  // Sort is ignored, matching ProductCollectionService.
  async searchProducts(
    params: ProductSearchParams
  ): Promise<ProductSearchResponse> {
    const {
      query,
      limit = ITEMS_PER_PAGE,
      page = MIN_PAGE,
      filters,
      priceMin,
      priceMax,
      saleOnly,
    } = params

    const allProducts = this.generateMatches(query)
    if (allProducts.length === 0) {
      return { products: [], facets: [], total: 0 }
    }

    const currency = resolveCurrencyFromLanguage(
      this.languageProvider.getCurrentLanguage()
    )
    const priceRange = calculatePriceRange(allProducts)
    const filteredProducts = filterProductCards(allProducts, {
      filters,
      saleOnly,
      priceMin,
      priceMax,
    })

    const facets = buildFacetsFromProducts(allProducts, filteredProducts)
    const offset = (page - 1) * limit
    const pageProducts = withShopinVariantSummary(
      this.mockApi.getFaker(),
      filteredProducts.slice(offset, offset + limit)
    )

    return {
      products: pageProducts.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: p.price && { ...p.price, currency },
        image: p.image,
        variantId: p.variantId,
        variantCount: p.variantCount,
        // the catalog record's attributes, as the collection gives them: stripped by the contract, read by a
        // shop's productCard hook
        attributes: p.attributes,
      })),
      facets,
      priceRange,
      total: filteredProducts.length,
    }
  }
}
