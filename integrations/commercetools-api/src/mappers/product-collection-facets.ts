import type {
  ProductSearchFacetResult,
  ProductSearchFacetResultBucket,
  ProductSearchFacetResultBucketEntry,
} from '@commercetools/platform-sdk'
import type {
  Facet,
  FacetTerm,
  FacetDisplayType,
} from '@core/contracts/product-collection/facet'
import { getLocalizedString } from '../helpers/get-localized-string'
import {
  parseColorPair,
  isCssColor,
  stripColorSuffix,
  extractColorValue,
} from '../helpers/color-utils'
import type { FilterableAttribute } from './product-collection-filterable-attributes'

const KNOWN_SIZES = new Set([
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '2XL',
  '3XL',
  '4XL',
])
const SIZE_PATTERN = /^\d{1,3}$/

function inferFacetDisplayType(terms: FacetTerm[]): FacetDisplayType {
  const allColor = terms.every((t) => {
    const pair = parseColorPair(t.term)
    return pair !== null || isCssColor(t.term)
  })
  if (allColor) {
    return 'color'
  }

  const allSize = terms.every(
    (t) => KNOWN_SIZES.has(t.term.toUpperCase()) || SIZE_PATTERN.test(t.term)
  )
  if (allSize) {
    return 'size'
  }

  return 'text'
}

export function mapFacetsFromResponse(
  facetResults: ProductSearchFacetResult[] | undefined,
  filterableAttributes: FilterableAttribute[],
  language: string
): Facet[] {
  if (!facetResults) {
    return []
  }

  const facets: Facet[] = []

  for (const attr of filterableAttributes) {
    const facetResult = facetResults.find(
      (f) => f.name === `${attr.name}-facet`
    ) as ProductSearchFacetResultBucket | undefined

    if (!facetResult?.buckets || facetResult.buckets.length === 0) {
      continue
    }

    const rawTerms: FacetTerm[] = facetResult.buckets.map(
      (b: ProductSearchFacetResultBucketEntry) => ({
        term: String(b.key),
        label: String(b.key).includes(':')
          ? String(b.key).slice(0, String(b.key).lastIndexOf(':')).trim()
          : String(b.key),
        count: b.count,
      })
    )

    if (rawTerms.length === 0) {
      continue
    }

    const displayType = inferFacetDisplayType(rawTerms)

    const terms: FacetTerm[] =
      displayType === 'color'
        ? rawTerms.map((t) => ({
            ...t,
            label: stripColorSuffix(t.label),
            colorHex: extractColorValue(t.term),
          }))
        : rawTerms

    facets.push({
      name: attr.name,
      label: getLocalizedString(attr.label, language) ?? attr.name,
      displayType,
      terms,
    })
  }

  return facets
}
