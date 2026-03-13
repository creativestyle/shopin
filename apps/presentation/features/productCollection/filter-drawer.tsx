'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { Switch } from '@/components/ui/switch'
import {
  VALID_SORT_OPTIONS,
  FILTER_RESET_PARAMS,
  type SortOption,
} from '@config/constants'
import type { Facet } from '@core/contracts/product-collection/facet'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import CloseIcon from '@/public/icons/close.svg'
import { FacetAccordionItem } from './components/facet-accordion-item'
import { PriceRangeAccordion } from './components/price-range-accordion'
import { FilterDrawerFooter } from './components/filter-drawer-footer'

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSort: SortOption
  facets: Facet[]
  currentFilters?: Filters
  saleOnly: boolean
  priceRange?: PriceRange
  currentPriceMin?: number
  currentPriceMax?: number
  onSortChange: (sort: string) => void
  onFilterToggle: (facetName: string, value: string) => void
  onSaleOnlyToggle: (checked: boolean) => void
  onPriceRangeApply: (
    localMin: number,
    localMax: number,
    rangeMin: number,
    rangeMax: number
  ) => void
}

export function FilterDrawer({
  open,
  onOpenChange,
  currentSort,
  facets,
  currentFilters = {},
  saleOnly,
  priceRange,
  currentPriceMin,
  currentPriceMax,
  onSortChange,
  onFilterToggle,
  onSaleOnlyToggle,
  onPriceRangeApply,
}: FilterDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('productCollection')
  const tCommon = useTranslations('common')

  const sortOptions = VALID_SORT_OPTIONS.map((option) => ({
    value: option,
    label: t(`sorting.${option}` as Parameters<typeof t>[0]),
  }))
  const currentSortLabel =
    sortOptions.find((opt) => opt.value === currentSort)?.label ?? ''

  const handleResetAll = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    for (const key of FILTER_RESET_PARAMS) {
      params.delete(key)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const handleApplyFilters = () => {
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className='!inset-y-0 !top-0 !right-0 !left-auto flex h-full !max-h-full w-full max-w-full !translate-x-0 !translate-y-0 flex-col p-0 md:!inset-y-0 md:!top-0 md:!max-h-full md:w-96 md:max-w-96 md:!translate-y-0'
        showCloseButton={false}
      >
        <DialogHeader className='relative flex h-14 w-full items-center justify-between bg-white !px-4 py-4'>
          <div className='relative h-6 w-6 shrink-0 opacity-0' />
          <DialogTitle className='text-base font-bold text-gray-950'>
            {t('filters.drawerTitle')}
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className='relative flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center'
            aria-label={tCommon('close')}
          >
            <CloseIcon className='h-6 w-6 shrink-0 text-gray-700' />
          </button>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-4 pb-24'>
          <Accordion
            type='multiple'
            className='w-full'
          >
            <AccordionItem value='sort'>
              <AccordionTrigger
                className='py-4 text-sm text-gray-950 normal-case'
                withArrow
              >
                <span>
                  <span className='font-bold'>{t('topbar.sortBy')}</span>
                  <span className='font-normal text-gray-700'>
                    : {currentSortLabel}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className='pt-2 pb-4'>
                <RadioGroup
                  value={currentSort}
                  onValueChange={onSortChange}
                  className='flex flex-col gap-3'
                >
                  {sortOptions.map((option) => {
                    const radioId = `sort-${option.value}`
                    return (
                      <label
                        key={option.value}
                        htmlFor={radioId}
                        className='flex cursor-pointer items-center gap-3'
                      >
                        <RadioGroupItem
                          id={radioId}
                          value={option.value}
                        />
                        <span className='text-sm text-gray-700'>
                          {option.label}
                        </span>
                      </label>
                    )
                  })}
                </RadioGroup>
              </AccordionContent>
            </AccordionItem>

            {facets.map((facet) => (
              <FacetAccordionItem
                key={facet.name}
                facet={facet}
                selectedValues={currentFilters?.[facet.name] || []}
                onFilterToggle={onFilterToggle}
              />
            ))}

            {priceRange && (
              <PriceRangeAccordion
                priceRange={priceRange}
                currentPriceMin={currentPriceMin}
                currentPriceMax={currentPriceMax}
                onPriceRangeApply={onPriceRangeApply}
              />
            )}
          </Accordion>

          <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
            <span
              className={`text-sm ${saleOnly ? 'font-bold' : 'font-normal'} text-gray-950`}
            >
              {t('filters.saleOnly' as Parameters<typeof t>[0])}
            </span>
            <Switch
              checked={saleOnly}
              onCheckedChange={onSaleOnlyToggle}
              scheme='gray'
            />
          </div>
        </div>

        <FilterDrawerFooter
          onResetAll={handleResetAll}
          onApplyFilters={handleApplyFilters}
        />
      </DialogContent>
    </Dialog>
  )
}
