/** CT API allows max 500 results per query for product types. */
export const PRODUCT_TYPES_FETCH_LIMIT = 500

/** Default number of product cards for simple/popup search. */
export const SEARCH_POPUP_PRODUCT_LIMIT = 4

/** Attribute type names that support faceted filtering. */
export const FACETABLE_TYPES = new Set(['ltext', 'text', 'enum', 'lenum'])

/** Attribute names excluded from faceted search despite being searchable. */
export const EXCLUDED_ATTR_NAMES = new Set([
  'product-description',
  'product-list-short-description',
  'features-long-description',
  'product-spec',
  'shortDescription',
])
