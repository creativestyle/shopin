import {
  FiltersSchema,
  SaleOnlySchema,
  PriceMinSchema,
  PriceMaxSchema,
  SortSchema,
} from '@core/contracts/product-collection/product-collection-page'
import {
  MIN_PAGE,
  DEFAULT_SORT_OPTION,
  type SortOption,
} from '@config/constants'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'

export type PlpSearchParams = {
  page: number
  sort: SortOption
  filters: Filters | undefined
  saleOnly: boolean
  priceMin: number | undefined
  priceMax: number | undefined
}

export function parsePlpSearchParams(
  search: Record<string, string | string[] | undefined>
): PlpSearchParams {
  const parsedPage =
    typeof search.page === 'string' ? parseInt(search.page, 10) : NaN
  const page =
    !isNaN(parsedPage) && parsedPage >= MIN_PAGE ? parsedPage : MIN_PAGE

  const sortResult = SortSchema.safeParse(search.sort)
  const sort: SortOption = sortResult.success
    ? sortResult.data
    : DEFAULT_SORT_OPTION

  const filtersResult = FiltersSchema.safeParse(search.filters)
  const filters = filtersResult.success ? filtersResult.data : undefined

  const saleOnly = SaleOnlySchema.parse(search.saleOnly)

  const priceMinResult = PriceMinSchema.safeParse(search.priceMin)
  const priceMin = priceMinResult.success ? priceMinResult.data : undefined

  const priceMaxResult = PriceMaxSchema.safeParse(search.priceMax)
  const priceMax = priceMaxResult.success ? priceMaxResult.data : undefined

  return { page, sort, filters, saleOnly, priceMin, priceMax }
}
