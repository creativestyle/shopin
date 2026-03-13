'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { ValueOptionItemResponse } from '@core/contracts/product/option-item'
import type { SelectorComponentProps } from './selector-registry'
import { getSelectorLayoutClass } from './selector-utils'

export type SizeOption = ValueOptionItemResponse

export interface ValueSelectorProps extends SelectorComponentProps {
  options: SizeOption[]
  maxVisible?: number
}

export const ValueSelector: React.FC<ValueSelectorProps> = ({
  options,
  value,
  onChange,
  className,
  maxVisible = 8,
  layout = 'inline',
}) => {
  const t = useTranslations('product')
  const [expanded, setExpanded] = useState(false)
  const visibleOptions = expanded
    ? options
    : options.slice(0, Math.max(0, maxVisible))
  const remainingCount = Math.max(0, options.length - visibleOptions.length)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className={getSelectorLayoutClass(layout)}>
        {visibleOptions.map((opt) => {
          const isSelected = value === opt.label
          return (
            <button
              key={opt.label}
              type='button'
              disabled={opt.disabled}
              onClick={() => onChange?.(opt.label)}
              className={cn(
                'flex h-10 min-w-16 cursor-pointer items-center justify-center lord-of-the-focus-ring rounded border px-4 py-2 text-sm font-normal transition-all',
                isSelected
                  ? 'border-2 border-gray-950 bg-white text-gray-950'
                  : 'border-gray-100 text-gray-700 hover:scale-[1.02] hover:border-gray-950 hover:shadow-sm',
                opt.disabled &&
                  'cursor-not-allowed border-gray-100 bg-gray-100 text-gray-500'
              )}
              aria-pressed={isSelected}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {!expanded && remainingCount > 0 && (
        <button
          type='button'
          onClick={() => setExpanded(true)}
          className='w-fit text-sm text-gray-700 underline'
          data-testid='show-more-sizes'
          aria-label={t('buyBox.showMoreSizesAria', { count: remainingCount })}
        >
          {t('buyBox.showMoreSizesButton', { count: remainingCount })}
        </button>
      )}
    </div>
  )
}
