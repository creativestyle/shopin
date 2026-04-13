import type { Facet, FacetTerm } from '@core/contracts/product-collection/facet'
import { getLocalizedString, LanguageTagUtils } from '@core/i18n'
import type { FacetableFieldType } from '@config/constants'
import {
  inferDisplayType,
  stripColorSuffix,
  extractColorHex,
} from './algolia-facet-utils'
import { buildAlgoliaAttrKey } from './algolia-query-utils'

export interface AttributeMetadata {
  name: string
  label: Record<string, string>
  fieldType: FacetableFieldType
}

export function mapAlgoliaFacets(
  algoliaFacets: Record<string, Record<string, number>> | undefined,
  attributeMetadata: AttributeMetadata[],
  language: string
): Facet[] {
  if (!algoliaFacets) {
    return []
  }

  const facets: Facet[] = []
  const langKey = LanguageTagUtils.toUnderscoreKey(language)
  for (const attr of attributeMetadata) {
    const facetKey = buildAlgoliaAttrKey(attr.name, attr.fieldType, langKey)
    const facetCounts = algoliaFacets[facetKey]
    if (!facetCounts || Object.keys(facetCounts).length === 0) {
      continue
    }

    const rawTerms: FacetTerm[] = Object.entries(facetCounts).map(
      ([term, count]) => ({
        term,
        label: term,
        count,
      })
    )

    const displayType = inferDisplayType(rawTerms)

    const terms: FacetTerm[] =
      displayType === 'color'
        ? rawTerms.map((t) => ({
            ...t,
            label: stripColorSuffix(t.label),
            colorHex: extractColorHex(t.term),
          }))
        : rawTerms

    const label = getLocalizedString(attr.label, language) ?? attr.name

    facets.push({ name: attr.name, label, displayType, terms })
  }

  return facets
}

export function mergeAlgoliaFacets(
  allOptions: Record<string, Record<string, number>> | undefined,
  filteredCounts: Record<string, Record<string, number>> | undefined
): Record<string, Record<string, number>> | undefined {
  if (!allOptions) {
    return filteredCounts
  }
  if (!filteredCounts) {
    return allOptions
  }

  const merged: Record<string, Record<string, number>> = {}
  for (const [facetKey, options] of Object.entries(allOptions)) {
    const filtered = filteredCounts[facetKey] ?? {}
    merged[facetKey] = {}
    for (const term of Object.keys(options)) {
      merged[facetKey][term] = filtered[term] ?? 0
    }
  }
  return merged
}
