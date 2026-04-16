import { LanguageTagUtils } from '@core/i18n'
import { LOCALIZED_ATTR_TYPES, SORT_OPTIONS } from '@config/constants'
import type { FacetableFieldType } from '@config/constants'
import type { AttributeMetadata } from './algolia-facets'

export interface AlgoliaFieldNames {
  langKey: string
  nameAttr: string
  priceField: string
  discountedPriceField: string
}

export function buildAlgoliaFieldNames(language: string): AlgoliaFieldNames {
  const langKey = LanguageTagUtils.toUnderscoreKey(language)
  return {
    langKey,
    nameAttr: `name_${langKey}`,
    priceField: `price_${langKey}_centAmount`,
    discountedPriceField: `price_${langKey}_discountedCentAmount`,
  }
}

export function buildAlgoliaAttrKey(
  name: string,
  fieldType: FacetableFieldType,
  langKey: string
): string {
  return LOCALIZED_ATTR_TYPES.has(fieldType)
    ? `attr_${name}_${langKey}`
    : `attr_${name}`
}

export function buildFacetAttributeNames(
  attributeMetadata: AttributeMetadata[],
  langKey: string
): string[] {
  return attributeMetadata.map((a) =>
    buildAlgoliaAttrKey(a.name, a.fieldType, langKey)
  )
}

export function buildAlgoliaFacetFilters(
  filters: Record<string, string[]> | undefined,
  attributeMetadata: AttributeMetadata[],
  langKey: string
): string[][] {
  const facetFilters: string[][] = []
  if (!filters) {
    return facetFilters
  }

  for (const [attrName, values] of Object.entries(filters)) {
    if (values.length === 0) {
      continue
    }
    const meta = attributeMetadata.find((a) => a.name === attrName)
    if (!meta) {
      continue
    }
    const algoliaKey = buildAlgoliaAttrKey(attrName, meta.fieldType, langKey)
    facetFilters.push(values.map((v) => `${algoliaKey}:${v}`))
  }

  return facetFilters
}

export function buildAlgoliaNumericFilters(
  priceField: string,
  discountedPriceField: string,
  priceMin?: number,
  priceMax?: number,
  saleOnly?: boolean
): string[] {
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
  return numericFilters
}

/**
 * Algolia uses virtual-replica indices for sorting.
 * Returns the replica index name for the given sort option,
 * or the primary index when no replica is needed.
 */
export function resolveAlgoliaSortIndex(
  primaryIndex: string,
  sort: string | undefined,
  language: string
): string {
  const langKey = LanguageTagUtils.toUnderscoreKey(language)

  switch (sort) {
    case SORT_OPTIONS.PRICE_ASC:
      return `${primaryIndex}_price_${langKey}_asc`
    case SORT_OPTIONS.PRICE_DESC:
      return `${primaryIndex}_price_${langKey}_desc`
    case SORT_OPTIONS.NAME_ASC:
      return `${primaryIndex}_name_${langKey}_asc`
    case SORT_OPTIONS.NAME_DESC:
      return `${primaryIndex}_name_${langKey}_desc`
    case SORT_OPTIONS.NEWEST:
      return `${primaryIndex}_newest`
    default:
      return primaryIndex
  }
}
