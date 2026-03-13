import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import {
  LANGUAGE_TOKEN,
  resolveCurrencyFromLanguage,
  resolveCountryFromLanguage,
} from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type { ProductCollectionResponse } from '@core/contracts/product-collection/product-collection'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import {
  ITEMS_PER_PAGE,
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'
import type { LocalizedString, Category } from '@commercetools/platform-sdk'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { mapProductToCard } from '../mappers/product-card'
import type { ProductProjectionApiResponse } from '../schemas/product-projection'
import {
  buildQueryFilters,
  buildPostFilters,
  buildFacets,
  buildSortExpressions,
  buildAttributeFilters,
} from '../helpers/product-collection-filters'
import {
  mapFacetsFromResponse,
  extractPriceRange,
  mapFilterableAttributes,
  mapCategoryTree,
  mergeFacetCounts,
  filterSaleOnlyResults,
  type FilterableAttribute,
} from '../mappers/product-collection'

@Injectable()
export class ProductCollectionService {
  private filterableAttributesCache: FilterableAttribute[] | null = null

  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  private async getFilterableAttributes(): Promise<FilterableAttribute[]> {
    if (this.filterableAttributesCache) {
      return this.filterableAttributesCache
    }

    const response = await this.client
      .productTypes()
      .get({ queryArgs: { limit: 100 } })
      .execute()

    this.filterableAttributesCache = mapFilterableAttributes(
      response.body.results
    )
    return this.filterableAttributesCache
  }

  private async resolveCategory(
    slug: string,
    language: string
  ): Promise<{
    category: Category
    categoryId: string
    categoryTree: ReturnType<typeof mapCategoryTree>
  }> {
    const categoryResponse = await this.client
      .categories()
      .get({
        queryArgs: {
          withTotal: false,
          where: `slug(${language}="${slug}")`,
          limit: 1,
        },
      })
      .execute()

    const category = categoryResponse.body.results[0]
    if (!category) {
      throw new NotFoundException(`Category not found for slug: ${slug}`)
    }

    const rootCategoryId = category.ancestors?.[0]?.id || category.id

    const allCategoriesResponse = await this.client
      .categories()
      .get({
        queryArgs: {
          where: `ancestors(id="${rootCategoryId}") or id="${rootCategoryId}"`,
          limit: 500,
        },
      })
      .execute()

    const categoryTree = mapCategoryTree(
      allCategoriesResponse.body.results,
      undefined,
      language
    )

    return { category, categoryId: category.id, categoryTree }
  }

  async getProductCollection(
    productCollectionSlug: string,
    page: number = MIN_PAGE,
    limit: number = ITEMS_PER_PAGE,
    sort: SortOption = DEFAULT_SORT_OPTION,
    filters?: Filters,
    saleOnly: boolean = false,
    priceMin?: number,
    priceMax?: number
  ): Promise<ProductCollectionResponse> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const offset = (page - 1) * limit
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)

    const [filterableAttributes, { category, categoryId, categoryTree }] =
      await Promise.all([
        this.getFilterableAttributes(),
        this.resolveCategory(productCollectionSlug, currentLanguage),
      ])

    const queryFilters = buildQueryFilters(categoryId, saleOnly)
    const attributeFilters = buildAttributeFilters(
      filters,
      currentLanguage,
      filterableAttributes
    )
    const postFilters = buildPostFilters(
      filters,
      currentLanguage,
      filterableAttributes,
      currency,
      priceMin,
      priceMax
    )
    const sortExpressions = buildSortExpressions(sort, currentLanguage)
    const facets = buildFacets(currentLanguage, filterableAttributes)

    const baseQuery =
      queryFilters.length === 1 ? queryFilters[0] : { and: queryFilters }

    // postFilter keeps all facet options visible regardless of active filters
    const mainSearchPromise = this.client
      .products()
      .search()
      .post({
        body: {
          query: baseQuery,
          ...(postFilters.length > 0 && {
            postFilter:
              postFilters.length === 1 ? postFilters[0] : { and: postFilters },
          }),
          productProjectionParameters: {
            localeProjection: [currentLanguage],
            priceCurrency: currency,
            priceCountry: country,
            staged: false,
          },
          facets,
          sort: sortExpressions,
          limit,
          offset,
        },
      })
      .execute()

    // The main search uses `postFilter` so facet buckets reflect ALL available
    // options regardless of the active selection (standard faceted-navigation UX).
    // However, `postFilter` does not affect facet counts — they still reflect
    // the unfiltered result set. To get accurate counts that respect active
    // filters we run a second facet-only query (limit:0) with the filters in
    // `query` instead of `postFilter`. The two sets of facets are then merged
    // by `mergeFacetCounts` (buckets from the main query, counts from here).
    const hasActiveFilters =
      attributeFilters.length > 0 ||
      priceMin !== undefined ||
      priceMax !== undefined ||
      saleOnly
    const countQueryFilters = [...queryFilters, ...attributeFilters]
    const countQuery =
      countQueryFilters.length === 1
        ? countQueryFilters[0]
        : { and: countQueryFilters }

    const countsPromise = hasActiveFilters
      ? this.client
          .products()
          .search()
          .post({
            body: {
              query: countQuery,
              facets,
              limit: 0,
            },
          })
          .execute()
      : Promise.resolve(null)

    const [searchResponse, countsResponse] = await Promise.all([
      mainSearchPromise,
      countsPromise,
    ])

    const facetResults = mergeFacetCounts(
      searchResponse.body.facets,
      countsResponse?.body.facets
    )

    const rawResults = searchResponse.body.results || []
    const results = saleOnly ? filterSaleOnlyResults(rawResults) : rawResults
    const total = saleOnly
      ? (countsResponse?.body.total ?? searchResponse.body.total ?? 0)
      : searchResponse.body.total || 0

    const categoryName =
      mapLocalized(
        (category?.name || {}) as LocalizedString,
        currentLanguage
      ) || productCollectionSlug

    return {
      productList: results
        .filter((r) => r.productProjection)
        .map((r) =>
          mapProductToCard(
            r.productProjection as ProductProjectionApiResponse,
            currentLanguage
          )
        ),
      breadcrumb: [
        { label: categoryName, path: `/c/${productCollectionSlug}` },
      ],
      total,
      facets: mapFacetsFromResponse(
        facetResults,
        filterableAttributes,
        currentLanguage
      ),
      priceRange: extractPriceRange(facetResults),
      categoryTree,
      currentCategoryId: categoryId,
    }
  }
}
