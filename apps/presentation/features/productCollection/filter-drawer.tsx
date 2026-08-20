'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { FacetAccordionItem } from './components/facet-accordion-item'
import { PriceRangeAccordion } from './components/price-range-accordion'
import { FilterDrawerFooter } from './components/filter-drawer-footer'

interface FilterDrawerProps {
  id?: string
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
  restoreFocusRef?: React.RefObject<HTMLElement | null>
}

export function FilterDrawer({
  id,
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
  restoreFocusRef,
}: FilterDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('productCollection')

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
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        id={id}
        className='md:max-w-96'
        restoreFocusRef={restoreFocusRef}
      >
        <SheetHeader className='text-center'>
          <SheetTitle>{t('filters.drawerTitle')}</SheetTitle>
          <SheetDescription className='sr-only'>
            {t('filters.dialogDescription' as Parameters<typeof t>[0])}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
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
                        className='flex cursor-pointer items-center gap-3'
                      >
                        <RadioGroupItem
                          id={radioId}
                          value={option.value}
                          aria-labelledby={`${radioId}-label`}
                        />
                        <span
                          id={`${radioId}-label`}
                          className='text-sm text-gray-700'
                        >
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

          <label className='flex cursor-pointer items-center justify-between border-t border-gray-200 pt-4'>
            <span
              id='filter-drawer-sale-only-label'
              className={`text-sm ${saleOnly ? 'font-bold' : 'font-normal'} text-gray-950`}
            >
              {t('filters.saleOnly' as Parameters<typeof t>[0])}
            </span>
            <Switch
              checked={saleOnly}
              onCheckedChange={onSaleOnlyToggle}
              scheme='gray'
              aria-labelledby='filter-drawer-sale-only-label'
            />
          </label>
        </SheetBody>

        <FilterDrawerFooter
          onResetAll={handleResetAll}
          onApplyFilters={handleApplyFilters}
        />
      </SheetContent>
    </Sheet>
  )
}
