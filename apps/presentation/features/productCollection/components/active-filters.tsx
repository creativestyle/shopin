'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import CloseIcon from '@/public/icons/close.svg'
import type { Facet } from '@core/contracts/product-collection/facet'
import {
  SEARCH_PARAM_PAGE,
  SEARCH_PARAM_FILTERS,
  SEARCH_PARAM_SALE_ONLY,
  SEARCH_PARAM_PRICE_MIN,
  SEARCH_PARAM_PRICE_MAX,
} from '@config/constants'
import {
  useActiveFilterChips,
  type ActiveFilterChip,
} from '../hooks/use-active-filter-chips'

interface ActiveFiltersProps {
  facets?: Facet[]
  saleOnly?: boolean
  currentPriceMin?: number
  currentPriceMax?: number
}

export function ActiveFilters({
  facets,
  saleOnly,
  currentPriceMin,
  currentPriceMax,
}: ActiveFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('productCollection')

  const chips = useActiveFilterChips({
    facets,
    saleOnly,
    currentPriceMin,
    currentPriceMax,
  })

  const updateParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    updater(params)
    params.delete(SEARCH_PARAM_PAGE)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const directParamKeys = new Set<string>([
    SEARCH_PARAM_SALE_ONLY,
    SEARCH_PARAM_PRICE_MIN,
    SEARCH_PARAM_PRICE_MAX,
  ])

  const handleRemoveChip = (chip: ActiveFilterChip) => {
    updateParams((params) => {
      if (directParamKeys.has(chip.filterKey)) {
        params.delete(chip.filterKey)
        if (
          chip.filterKey === SEARCH_PARAM_PRICE_MIN ||
          chip.filterKey === SEARCH_PARAM_PRICE_MAX
        ) {
          params.delete(SEARCH_PARAM_PRICE_MIN)
          params.delete(SEARCH_PARAM_PRICE_MAX)
        }
      } else {
        const filtersParam = params.get(SEARCH_PARAM_FILTERS)
        if (!filtersParam) {
          return
        }
        try {
          const parsed = JSON.parse(filtersParam) as Record<string, string[]>
          const remaining = (parsed[chip.filterKey] ?? []).filter(
            (v) => v !== chip.filterValue
          )
          if (remaining.length === 0) {
            delete parsed[chip.filterKey]
          } else {
            parsed[chip.filterKey] = remaining
          }
          if (Object.keys(parsed).length === 0) {
            params.delete(SEARCH_PARAM_FILTERS)
          } else {
            params.set(SEARCH_PARAM_FILTERS, JSON.stringify(parsed))
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    })
  }

  if (chips.length === 0) {
    return null
  }

  const handleClearAll = () => {
    updateParams((params) => {
      for (const key of [
        SEARCH_PARAM_FILTERS,
        SEARCH_PARAM_SALE_ONLY,
        SEARCH_PARAM_PRICE_MIN,
        SEARCH_PARAM_PRICE_MAX,
      ]) {
        params.delete(key)
      }
    })
  }

  return (
    <div className='mb-4 flex flex-wrap items-center gap-2 text-sm md:gap-x-6 md:gap-y-2'>
      <span className='shrink-0'>
        {t('filters.appliedFilters' as Parameters<typeof t>[0])}:
      </span>

      <div className='contents md:flex md:flex-wrap md:items-center md:gap-2'>
        {chips.map((chip) => (
          <button
            key={chip.id}
            type='button'
            onClick={() => handleRemoveChip(chip)}
            className='flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-gray-100 px-3 py-0.5 text-sm'
          >
            {chip.label}
            <CloseIcon
              className='h-5 w-5'
              aria-hidden='true'
            />
          </button>
        ))}
      </div>

      <button
        className='shrink-0 cursor-pointer text-sm underline'
        type='button'
        onClick={handleClearAll}
      >
        {t('filters.clearAll' as Parameters<typeof t>[0])}
      </button>
    </div>
  )
}
