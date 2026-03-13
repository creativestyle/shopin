'use client'

import { useTranslations } from 'next-intl'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Slider } from '@/components/ui/range-slider'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'
import { usePriceRange } from '../hooks/use-price-range'
import { formatPrice, parsePriceInput } from '../lib/price-utils'

interface PriceRangeAccordionProps {
  priceRange: PriceRange
  currentPriceMin?: number
  currentPriceMax?: number
  onPriceRangeApply: (
    localMin: number,
    localMax: number,
    rangeMin: number,
    rangeMax: number
  ) => void
}

export function PriceRangeAccordion({
  priceRange,
  currentPriceMin,
  currentPriceMax,
  onPriceRangeApply,
}: PriceRangeAccordionProps) {
  const t = useTranslations('productCollection')
  const {
    minPrice,
    maxPrice,
    localPriceMin,
    localPriceMax,
    setLocalPriceMin,
    setLocalPriceMax,
    applyPriceRange,
  } = usePriceRange(
    priceRange,
    currentPriceMin,
    currentPriceMax,
    onPriceRangeApply
  )

  return (
    <AccordionItem value='price'>
      <AccordionTrigger
        className='py-4 text-sm text-gray-950 normal-case'
        withArrow
      >
        <span>
          <span
            className={
              currentPriceMin !== undefined || currentPriceMax !== undefined
                ? 'font-bold'
                : 'font-normal'
            }
          >
            {t('filters.priceRange' as Parameters<typeof t>[0])}
          </span>
          {(currentPriceMin !== undefined || currentPriceMax !== undefined) && (
            <span className='font-normal text-gray-700'>
              : ${formatPrice(localPriceMin)} — ${formatPrice(localPriceMax)}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className='pt-2 pb-4'>
        <div className='mb-4 px-1'>
          <Slider
            min={minPrice}
            max={maxPrice}
            step={100}
            value={[localPriceMin, localPriceMax]}
            onValueChange={([min, max]) => {
              setLocalPriceMin(min)
              setLocalPriceMax(max)
            }}
            onValueCommit={applyPriceRange}
          />
        </div>
        <div className='flex items-center gap-3'>
          <div className='flex-1'>
            <label className='mb-1 block text-xs text-gray-500'>Min</label>
            <div className='relative'>
              <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500'>
                $
              </span>
              <input
                type='number'
                value={formatPrice(localPriceMin)}
                onChange={(e) => {
                  const cents = parsePriceInput(e.target.value)
                  setLocalPriceMin(
                    Math.max(minPrice, Math.min(cents, localPriceMax))
                  )
                }}
                onBlur={applyPriceRange}
                onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                className='w-full rounded border border-gray-300 py-2 pr-3 pl-7 text-sm focus:border-gray-500 focus:outline-none'
                min={formatPrice(minPrice)}
                max={formatPrice(maxPrice)}
                step='0.01'
              />
            </div>
          </div>
          <div className='mt-5 text-gray-400'>—</div>
          <div className='flex-1'>
            <label className='mb-1 block text-xs text-gray-500'>Max</label>
            <div className='relative'>
              <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500'>
                $
              </span>
              <input
                type='number'
                value={formatPrice(localPriceMax)}
                onChange={(e) => {
                  const cents = parsePriceInput(e.target.value)
                  setLocalPriceMax(
                    Math.min(maxPrice, Math.max(cents, localPriceMin))
                  )
                }}
                onBlur={applyPriceRange}
                onKeyDown={(e) => e.key === 'Enter' && applyPriceRange()}
                className='w-full rounded border border-gray-300 py-2 pr-3 pl-7 text-sm focus:border-gray-500 focus:outline-none'
                min={formatPrice(minPrice)}
                max={formatPrice(maxPrice)}
                step='0.01'
              />
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
