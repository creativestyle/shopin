'use client'

import { useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  DEFAULT_SORT_OPTION,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SORT,
  SEARCH_PARAM_FILTERS,
  SEARCH_PARAM_SALE_ONLY,
  SEARCH_PARAM_PRICE_MIN,
  SEARCH_PARAM_PRICE_MAX,
  type SortOption,
} from '@config/constants'

export function parseFilters(
  raw: string | null | undefined
): Record<string, string[]> | undefined {
  if (!raw) {
    return undefined
  }
  try {
    return JSON.parse(raw) as Record<string, string[]>
  } catch {
    return undefined
  }
}

function parseOptionalNumber(
  raw: string | null | undefined
): number | undefined {
  if (!raw) {
    return undefined
  }
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

/** Read the current filter state from URL search params. */
export function useFilterState() {
  const searchParams = useSearchParams()

  const currentSort = (searchParams?.get(SEARCH_PARAM_SORT) ??
    DEFAULT_SORT_OPTION) as SortOption
  const saleOnly = searchParams?.get(SEARCH_PARAM_SALE_ONLY) === 'true'
  const priceMin = parseOptionalNumber(
    searchParams?.get(SEARCH_PARAM_PRICE_MIN)
  )
  const priceMax = parseOptionalNumber(
    searchParams?.get(SEARCH_PARAM_PRICE_MAX)
  )
  const currentFilters = useMemo(
    () => parseFilters(searchParams?.get(SEARCH_PARAM_FILTERS)),
    [searchParams]
  )

  return { currentSort, saleOnly, priceMin, priceMax, currentFilters }
}

/** Write (mutate) filter state into URL search params. */
export function useFilterParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pushParams = (params: URLSearchParams) => {
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete(SEARCH_PARAM_PAGE)

    if (newSort === DEFAULT_SORT_OPTION) {
      params.delete(SEARCH_PARAM_SORT)
    } else {
      params.set(SEARCH_PARAM_SORT, newSort)
    }

    pushParams(params)
  }

  const handleFilterToggle = (facetName: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete(SEARCH_PARAM_PAGE)

    const filters: Record<string, string[]> =
      parseFilters(params.get(SEARCH_PARAM_FILTERS)) ?? {}

    const currentValues = filters[facetName] || []
    const isCurrentlySelected = currentValues.includes(value)

    if (isCurrentlySelected) {
      const newValues = currentValues.filter((v) => v !== value)
      if (newValues.length === 0) {
        delete filters[facetName]
      } else {
        filters[facetName] = newValues
      }
    } else {
      filters[facetName] = [...currentValues, value]
    }

    if (Object.keys(filters).length === 0) {
      params.delete(SEARCH_PARAM_FILTERS)
    } else {
      params.set(SEARCH_PARAM_FILTERS, JSON.stringify(filters))
    }

    pushParams(params)
  }

  const handleSaleOnlyToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete(SEARCH_PARAM_PAGE)

    if (checked) {
      params.set(SEARCH_PARAM_SALE_ONLY, 'true')
    } else {
      params.delete(SEARCH_PARAM_SALE_ONLY)
    }

    pushParams(params)
  }

  const applyPriceRange = (
    localMin: number,
    localMax: number,
    rangeMin: number,
    rangeMax: number
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    params.delete(SEARCH_PARAM_PAGE)

    if (localMin > rangeMin) {
      params.set(SEARCH_PARAM_PRICE_MIN, localMin.toString())
    } else {
      params.delete(SEARCH_PARAM_PRICE_MIN)
    }

    if (localMax < rangeMax) {
      params.set(SEARCH_PARAM_PRICE_MAX, localMax.toString())
    } else {
      params.delete(SEARCH_PARAM_PRICE_MAX)
    }

    pushParams(params)
  }

  return {
    handleSortChange,
    handleFilterToggle,
    handleSaleOnlyToggle,
    applyPriceRange,
  }
}
