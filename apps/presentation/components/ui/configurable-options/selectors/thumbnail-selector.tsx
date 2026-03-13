// TODO: The most accessible solution here would be to use radio inputs
'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ImageOptionItemResponse } from '@core/contracts/product/option-item'
import type { SelectorComponentProps } from './selector-registry'
import { getSelectorLayoutClass } from './selector-utils'

export type ThumbnailOption = ImageOptionItemResponse

export interface ThumbnailSelectorProps extends SelectorComponentProps {
  options: ThumbnailOption[]
}

export const ThumbnailSelector: React.FC<ThumbnailSelectorProps> = ({
  options,
  value,
  onChange,
  className,
  layout = 'inline',
}) => {
  return (
    <div className={cn(getSelectorLayoutClass(layout, false), className)}>
      {options.map((opt) => {
        const selected = opt.label === value
        return (
          <button
            key={opt.label}
            type='button'
            disabled={opt.disabled}
            onClick={() => onChange?.(opt.label)}
            className={cn(
              'lord-of-the-focus-ring rounded border p-0.5 transition-all',
              selected
                ? 'border-1 border-gray-950'
                : 'cursor-pointer border-transparent hover:border-gray-300 hover:shadow-sm',
              {
                'cursor-not-allowed opacity-40': opt.disabled,
              }
            )}
            aria-pressed={selected}
            aria-label={opt.label}
            title={opt.label}
          >
            <div
              className={cn(
                'relative size-full cursor-pointer overflow-hidden rounded',
                layout === 'grid'
                  ? 'aspect-square w-full'
                  : 'size-full max-h-15 min-h-10 max-w-15'
              )}
            >
              <Image
                src={opt.imageSrc}
                alt={opt.label}
                width={layout === 'grid' ? 200 : 60}
                height={layout === 'grid' ? 200 : 60}
                className='size-full object-contain'
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
