'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  DEFAULT_SORT_OPTION,
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_SORT,
  SEARCH_PARAM_FILTERS,
  SEARCH_PARAM_SALE_ONLY,
  SEARCH_PARAM_PRICE_MIN,
  SEARCH_PARAM_PRICE_MAX,
} from '@config/constants'

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

    const filtersParam = params.get(SEARCH_PARAM_FILTERS)
    let filters: Record<string, string[]> = {}
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam)
      } catch {
        filters = {}
      }
    }

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
