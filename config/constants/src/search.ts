/** CT API allows max 500 results per query for product types. */
export const PRODUCT_TYPES_FETCH_LIMIT = 500

/** Default number of product cards for simple/popup search. */
export const SEARCH_POPUP_PRODUCT_LIMIT = 4

/** Minimum number of characters required for a search query. */
export const MIN_SEARCH_QUERY_LENGTH = 3

/** Debounce delay (ms) for search input on the frontend. */
export const SEARCH_DEBOUNCE_MS = 300

/** Default number of autocomplete suggestions returned by the search provider. */
export const DEFAULT_SUGGESTION_LIMIT = 10

/** Attribute type names that support faceted filtering. */
export const FACETABLE_TYPES = new Set([
  'ltext',
  'text',
  'enum',
  'lenum',
] as const)

/** Union of attribute type names that support faceted filtering. */
export type FacetableFieldType =
  typeof FACETABLE_TYPES extends Set<infer T> ? T : never

/** Attribute type names whose values are localized (need a language-keyed Algolia field). */
export const LOCALIZED_ATTR_TYPES = new Set(['ltext', 'lenum'])

/** Attribute names excluded from faceted search despite being searchable. */
export const EXCLUDED_ATTR_NAMES = new Set([
  'product-description',
  'product-list-short-description',
  'features-long-description',
  'product-spec',
  'shortDescription',
])
