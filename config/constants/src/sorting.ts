/**
 * Sorting options for product collections.
 * These values are used as API parameters and URL query params.
 */
export const SORT_OPTIONS = {
  /** Default sorting - top sellers first */
  TOP_SELLERS: 'top-sellers',
  /** Sort by price ascending (low to high) */
  PRICE_ASC: 'price-asc',
  /** Sort by price descending (high to low) */
  PRICE_DESC: 'price-desc',
  /** Sort by newest products first */
  NEWEST: 'newest',
  /** Sort by review/rating score (highest first) */
  REVIEW_SCORE: 'review-score',
  /** Sort by name/brand alphabetically A-Z */
  NAME_ASC: 'name-asc',
  /** Sort by name/brand alphabetically Z-A */
  NAME_DESC: 'name-desc',
} as const

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS]

/** Default sort option when none is specified */
export const DEFAULT_SORT_OPTION: SortOption = SORT_OPTIONS.TOP_SELLERS

/** List of all valid sort options */
export const VALID_SORT_OPTIONS: SortOption[] = [
  SORT_OPTIONS.TOP_SELLERS,
  SORT_OPTIONS.PRICE_ASC,
  SORT_OPTIONS.PRICE_DESC,
  SORT_OPTIONS.NEWEST,
  SORT_OPTIONS.REVIEW_SCORE,
  SORT_OPTIONS.NAME_ASC,
  SORT_OPTIONS.NAME_DESC,
]
