'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  SelectRoot,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { VALID_SORT_OPTIONS, type SortOption } from '@config/constants'
import type { Facet } from '@core/contracts/product-collection/facet'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import { cn } from '@/lib/utils'
import OpenMenuIcon from '@/public/icons/open-menu.svg'
import HideMenuIcon from '@/public/icons/hide-menu.svg'
import { useFilterParams } from './hooks/use-filter-params'
import { FilterDropdown } from './components/filter-dropdown'
import { FilterDrawer } from './filter-drawer'

const VISIBLE_FACETS_COUNT = 3

interface ProductCollectionToolbarProps {
  currentSort: SortOption
  facets?: Facet[]
  currentFilters?: Filters
  saleOnly?: boolean
  priceRange?: PriceRange
  currentPriceMin?: number
  currentPriceMax?: number
  showCategoriesButton?: boolean
  showCategories?: boolean
  onToggleCategories?: () => void
  className?: string
}

export function ProductCollectionToolbar({
  currentSort,
  facets = [],
  currentFilters = {},
  saleOnly = false,
  showCategoriesButton = true,
  showCategories = false,
  onToggleCategories,
  priceRange,
  currentPriceMin,
  currentPriceMax,
  className,
}: ProductCollectionToolbarProps) {
  const t = useTranslations('productCollection')
  const {
    handleSortChange,
    handleFilterToggle,
    handleSaleOnlyToggle,
    applyPriceRange,
  } = useFilterParams()
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

  const sortOptions = VALID_SORT_OPTIONS.map((option) => ({
    value: option,
    label: t(`sorting.${option}` as Parameters<typeof t>[0]),
  }))
  const currentSortLabel =
    sortOptions.find((opt) => opt.value === currentSort)?.label ?? ''

  const visibleFacets = facets.slice(0, VISIBLE_FACETS_COUNT)

  return (
    <>
      <div
        className={cn(
          'relative flex h-16 items-center justify-between gap-3',
          'before:absolute before:top-0 before:left-1/2 before:h-px before:w-[100cqw] before:-translate-x-1/2 before:bg-gray-100',
          'after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-[100cqw] after:-translate-x-1/2 after:bg-gray-100',
          className
        )}
      >
        <div className='flex shrink-0 items-center'>
          {showCategoriesButton && (
            <div className='hidden items-center gap-[30px] lg:flex'>
              <button
                onClick={onToggleCategories}
                className='flex cursor-pointer items-center gap-[5px] text-sm font-bold'
              >
                {showCategories ? (
                  <HideMenuIcon className='h-4 w-4' />
                ) : (
                  <OpenMenuIcon className='h-4 w-4' />
                )}
                {showCategories
                  ? t('topbar.hideCategories')
                  : t('topbar.showCategories')}
              </button>
              <div className='h-16 w-px bg-gray-100' />
            </div>
          )}

          <div
            className={cn(
              'flex shrink-0 items-center gap-3',
              showCategoriesButton && 'lg:pl-[30px]'
            )}
          >
            {visibleFacets.map((facet) => (
              <FilterDropdown
                key={facet.name}
                facet={facet}
                selectedValues={currentFilters?.[facet.name] || []}
                onToggle={handleFilterToggle}
                className='hidden md:flex'
              />
            ))}

            {(facets.length > 0 || priceRange) && (
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className='flex h-10 cursor-pointer items-center gap-1 rounded-3xl bg-gray-100 px-4 text-sm font-bold'
              >
                {t('topbar.allFilters')}
              </button>
            )}
          </div>
        </div>

        <SelectRoot
          value={currentSort}
          onValueChange={handleSortChange}
        >
          <SelectTrigger
            className='h-10 shrink-0 cursor-pointer rounded-3xl border-0 bg-gray-100 px-3 text-sm font-bold'
            aria-label={t('topbar.sortBy')}
          >
            <span>{currentSortLabel}</span>
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>

      <FilterDrawer
        open={isFilterDrawerOpen}
        onOpenChange={setIsFilterDrawerOpen}
        currentSort={currentSort}
        facets={facets}
        currentFilters={currentFilters}
        saleOnly={saleOnly}
        priceRange={priceRange}
        currentPriceMin={currentPriceMin}
        currentPriceMax={currentPriceMax}
        onSortChange={handleSortChange}
        onFilterToggle={handleFilterToggle}
        onSaleOnlyToggle={handleSaleOnlyToggle}
        onPriceRangeApply={applyPriceRange}
      />
    </>
  )
}
