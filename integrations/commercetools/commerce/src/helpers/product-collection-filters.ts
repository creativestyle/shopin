import type {
  SearchSorting,
  SearchSortOrder,
} from '@commercetools/platform-sdk'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import { SORT_OPTIONS, type SortOption } from '@config/constants'
import type { FilterableAttribute } from '../mappers/product-collection'

export function buildQueryFilters(
  categoryId: string,
  saleOnly: boolean = false
): object[] {
  const filters: object[] = [
    { exact: { field: 'categoriesSubTree', value: categoryId } },
  ]
  if (saleOnly) {
    filters.push({ exists: { field: 'variants.prices.discounted' } })
  }
  return filters
}

export function buildAttributeFilters(
  filters: Filters | undefined,
  language: string,
  filterableAttributes: FilterableAttribute[]
): object[] {
  const attributeFilters: object[] = []

  if (!filters) {
    return attributeFilters
  }

  for (const [attrName, values] of Object.entries(filters)) {
    if (!values || values.length === 0) {
      continue
    }

    const attr = filterableAttributes.find((a) => a.name === attrName)
    if (!attr) {
      continue
    }

    const isEnum = attr.fieldType === 'enum' || attr.fieldType === 'lenum'
    // lenum is also queried via .key, so isLocalizedText only applies to ltext
    const isLocalizedText = attr.fieldType === 'ltext'

    // enum/lenum must be queried via the .key subfield
    const field = isEnum
      ? `variants.attributes.${attrName}.key`
      : `variants.attributes.${attrName}`

    // Multiple values for same attribute are ORed
    const valueFilters = values.map((value) => {
      if (isEnum) {
        return { exact: { field, value } }
      }
      if (isLocalizedText) {
        return { exact: { field, value, fieldType: attr.fieldType, language } }
      }
      return { exact: { field, value, fieldType: attr.fieldType } }
    })

    if (valueFilters.length === 1) {
      attributeFilters.push(valueFilters[0])
    } else {
      attributeFilters.push({ or: valueFilters })
    }
  }

  return attributeFilters
}

export function buildPostFilters(
  filters: Filters | undefined,
  language: string,
  filterableAttributes: FilterableAttribute[],
  currency?: string,
  priceMin?: number,
  priceMax?: number
): object[] {
  const postFilters: object[] = []

  postFilters.push(
    ...buildAttributeFilters(filters, language, filterableAttributes)
  )

  // Price range filter scoped to active currency to prevent cross-currency comparisons
  if (priceMin !== undefined || priceMax !== undefined) {
    const priceConditions: object[] = []
    if (currency) {
      priceConditions.push({
        exact: { field: 'variants.prices.currencyCode', value: currency },
      })
    }
    priceConditions.push({
      range: {
        field: 'variants.prices.centAmount',
        ...(priceMin !== undefined && { gte: priceMin }),
        ...(priceMax !== undefined && { lte: priceMax }),
      },
    })
    postFilters.push(
      priceConditions.length === 1
        ? priceConditions[0]
        : { and: priceConditions }
    )
  }

  return postFilters
}

export function buildFacets(
  language: string,
  filterableAttributes: FilterableAttribute[]
): object[] {
  const facets = filterableAttributes.map((attr) => {
    const isEnum = attr.fieldType === 'enum' || attr.fieldType === 'lenum'

    // enum/lenum must be faceted via the .key subfield (plain text, no fieldType/language needed)
    if (isEnum) {
      return {
        distinct: {
          name: `${attr.name}-facet`,
          field: `variants.attributes.${attr.name}.key`,
          level: 'variants' as const,
        },
      }
    }

    return {
      distinct: {
        name: `${attr.name}-facet`,
        field: `variants.attributes.${attr.name}`,
        level: 'variants' as const,
        fieldType: attr.fieldType,
        ...(attr.fieldType === 'ltext' ? { language } : {}),
      },
    }
  })

  // Price facet — 'number' fieldType not in CT SDK types but accepted by CT API
  facets.push({
    distinct: {
      name: 'price-facet',
      field: 'variants.prices.centAmount',
      level: 'variants' as const,
      fieldType: 'number' as unknown as 'text',
    },
  })

  return facets
}

export function buildSortExpressions(
  sort: SortOption,
  language: string
): SearchSorting[] {
  const asc: SearchSortOrder = 'asc'
  const desc: SearchSortOrder = 'desc'

  switch (sort) {
    case SORT_OPTIONS.PRICE_ASC:
      return [{ field: 'variants.prices.centAmount', order: asc }]
    case SORT_OPTIONS.PRICE_DESC:
      return [{ field: 'variants.prices.centAmount', order: desc }]
    case SORT_OPTIONS.NAME_ASC:
      return [{ field: 'name', language, order: asc }]
    case SORT_OPTIONS.NAME_DESC:
      return [{ field: 'name', language, order: desc }]
    case SORT_OPTIONS.NEWEST:
      return [{ field: 'createdAt', order: desc }]
    // top-sellers and review-score not available in CT product search
    case SORT_OPTIONS.TOP_SELLERS:
    case SORT_OPTIONS.REVIEW_SCORE:
    default:
      return [{ field: 'createdAt', order: desc }]
  }
}
