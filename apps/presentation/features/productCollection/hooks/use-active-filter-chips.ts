'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { Facet } from '@core/contracts/product-collection/facet'
import {
  SEARCH_PARAM_FILTERS,
  SEARCH_PARAM_SALE_ONLY,
  SEARCH_PARAM_PRICE_MIN,
} from '@config/constants'
import { parseFilters } from './use-filter-params'

export interface ActiveFilterChip {
  id: string
  label: string
  filterKey: string
  filterValue?: string
}

interface UseActiveFilterChipsParams {
  facets?: Facet[]
  saleOnly?: boolean
  currentPriceMin?: number
  currentPriceMax?: number
}

export function useActiveFilterChips({
  facets,
  saleOnly,
  currentPriceMin,
  currentPriceMax,
}: UseActiveFilterChipsParams): ActiveFilterChip[] {
  const searchParams = useSearchParams()
  const t = useTranslations('productCollection')

  const chips: ActiveFilterChip[] = []

  const parsed = parseFilters(searchParams?.get(SEARCH_PARAM_FILTERS))
  if (parsed) {
    for (const [attr, values] of Object.entries(parsed)) {
      const facet = facets?.find((f) => f.name === attr)
      const facetLabel = facet?.label ?? attr
      for (const value of values) {
        const termLabel =
          facet?.terms.find((t) => t.term === value)?.label ?? value
        chips.push({
          id: `${attr}:${value}`,
          label: `${facetLabel}: ${termLabel}`,
          filterKey: attr,
          filterValue: value,
        })
      }
    }
  }

  if (saleOnly) {
    chips.push({
      id: SEARCH_PARAM_SALE_ONLY,
      label: t('filters.saleOnly' as Parameters<typeof t>[0]),
      filterKey: SEARCH_PARAM_SALE_ONLY,
    })
  }

  if (currentPriceMin !== undefined || currentPriceMax !== undefined) {
    const min =
      currentPriceMin !== undefined
        ? `$${(currentPriceMin / 100).toFixed(2)}`
        : ''
    const max =
      currentPriceMax !== undefined
        ? `$${(currentPriceMax / 100).toFixed(2)}`
        : ''
    const rangeText = min && max ? `${min} — ${max}` : min || max
    chips.push({
      id: 'price',
      label: `${t('filters.priceRange' as Parameters<typeof t>[0])}: ${rangeText}`,
      filterKey: SEARCH_PARAM_PRICE_MIN,
    })
  }

  return chips
}
