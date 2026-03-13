export const SEARCH_PARAM_PAGE = 'page' as const
export const SEARCH_PARAM_SORT = 'sort' as const
export const SEARCH_PARAM_FILTERS = 'filters' as const
export const SEARCH_PARAM_SALE_ONLY = 'saleOnly' as const
export const SEARCH_PARAM_PRICE_MIN = 'priceMin' as const
export const SEARCH_PARAM_PRICE_MAX = 'priceMax' as const

/** All search params to clear on a full filter reset (drawer "reset all"). */
export const FILTER_RESET_PARAMS = [
  SEARCH_PARAM_FILTERS,
  SEARCH_PARAM_SALE_ONLY,
  SEARCH_PARAM_PRICE_MIN,
  SEARCH_PARAM_PRICE_MAX,
  SEARCH_PARAM_SORT,
  SEARCH_PARAM_PAGE,
] as const
