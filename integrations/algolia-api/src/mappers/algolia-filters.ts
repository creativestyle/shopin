import { LanguageTagUtils } from '@core/i18n'
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

function buildAlgoliaAttrKey(
  name: string,
  fieldType: string,
  langKey: string
): string {
  return fieldType === 'ltext' ? `attr_${name}_${langKey}` : `attr_${name}`
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
    if (values.length > 0) {
      const meta = attributeMetadata.find((a) => a.name === attrName)
      const algoliaKey = buildAlgoliaAttrKey(
        attrName,
        meta?.fieldType ?? '',
        langKey
      )
      facetFilters.push(values.map((v) => `${algoliaKey}:${v}`))
    }
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
