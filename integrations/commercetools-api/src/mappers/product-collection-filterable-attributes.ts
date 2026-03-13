import type { LocalizedString, ProductType } from '@commercetools/platform-sdk'

export interface FilterableAttribute {
  name: string
  label: LocalizedString
  fieldType: 'ltext' | 'text' | 'enum' | 'lenum'
}

const FACETABLE_TYPES = new Set(['ltext', 'text', 'enum', 'lenum'])

const EXCLUDED_ATTR_NAMES = new Set([
  'product-description',
  'product-list-short-description',
  'features-long-description',
  'product-spec',
  'shortDescription',
])

export function mapFilterableAttributes(
  productTypes: ProductType[]
): FilterableAttribute[] {
  const seen = new Map<string, FilterableAttribute>()
  for (const pt of productTypes) {
    for (const attr of pt.attributes ?? []) {
      if (seen.has(attr.name)) {
        continue
      }
      if (!attr.isSearchable) {
        continue
      }
      const typeName = attr.type.name
      if (!FACETABLE_TYPES.has(typeName)) {
        continue
      }
      if (EXCLUDED_ATTR_NAMES.has(attr.name)) {
        continue
      }
      seen.set(attr.name, {
        name: attr.name,
        label: attr.label,
        fieldType: typeName as FilterableAttribute['fieldType'],
      })
    }
  }
  return Array.from(seen.values())
}
