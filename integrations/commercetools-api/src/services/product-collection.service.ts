import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { COMMERCETOOLS_CLIENT, Client } from '../client/client.module'
import {
  LANGUAGE_TOKEN,
  LanguageTagUtils,
  resolveCurrencyFromLanguage,
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
import {
  buildQueryFilters,
  buildPostFilters,
  buildFacets,
  buildSortExpressions,
  buildAttributeFilters,
} from '../helpers/product-collection-filters'
import { executeFacetedSearch } from '../helpers/faceted-search'
import { mapCategoryTree } from '../mappers/product-collection'
import { FilterableAttributesCacheService } from './filterable-attributes-cache.service'

@Injectable()
export class ProductCollectionService {
  constructor(
    @Inject(COMMERCETOOLS_CLIENT) private readonly client: Client,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly filterableAttributesCache: FilterableAttributesCacheService
  ) {}

  private async resolveCategory(
    slug: string,
    language: string
  ): Promise<{
    category: Category
    categoryId: string
    categoryTree: ReturnType<typeof mapCategoryTree>
    slugByLocale: Record<string, string>
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

    const categorySlugMap = (category.slug ?? {}) as LocalizedString
    const slugByLocale = Object.fromEntries(
      Object.entries(categorySlugMap).filter(
        ([, value]) => typeof value === 'string' && value.length > 0
      )
    ) as Record<string, string>

    return { category, categoryId: category.id, categoryTree, slugByLocale }
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
    const country = LanguageTagUtils.getCountry(currentLanguage) ?? ''

    const [
      filterableAttributes,
      { category, categoryId, categoryTree, slugByLocale },
    ] = await Promise.all([
      this.filterableAttributesCache.getFilterableAttributes(),
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

    const {
      products,
      facets: mappedFacets,
      priceRange,
      total,
    } = await executeFacetedSearch({
      client: this.client,
      baseQuery,
      countQuery,
      hasActiveFilters,
      postFilters,
      facets,
      sortExpressions,
      language: currentLanguage,
      currency,
      country,
      limit,
      offset,
      filterableAttributes,
    })

    const categoryName =
      mapLocalized(
        (category?.name || {}) as LocalizedString,
        currentLanguage
      ) || productCollectionSlug

    return {
      productList: products,
      breadcrumb: [
        { label: categoryName, path: `/c/${productCollectionSlug}` },
      ],
      total,
      facets: mappedFacets,
      priceRange,
      categoryTree,
      currentCategoryId: categoryId,
      slugByLocale,
    }
  }
}
