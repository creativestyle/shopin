// TODO: The most accessible solution here would be to use radio inputs
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ColorOptionItemResponse } from '@core/contracts/product/option-item'
import type { SelectorComponentProps } from './selector-registry'
import { getSelectorLayoutClass } from './selector-utils'

export type ColorOption = ColorOptionItemResponse

export interface ColorSelectorProps extends SelectorComponentProps {
  options: ColorOption[]
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  options,
  value,
  onChange,
  className,
  layout = 'inline',
}) => {
  return (
    <div className={cn(getSelectorLayoutClass(layout), className)}>
      {options.map((opt) => {
        const isSelected = value === opt.label
        return (
          <button
            key={opt.label}
            type='button'
            disabled={opt.disabled}
            onClick={() => onChange?.(opt.label)}
            className={cn(
              'size-7 cursor-pointer lord-of-the-focus-ring rounded-full border transition-all focus-visible:ring-black focus-visible:ring-offset-2',
              isSelected
                ? 'border-transparent ring-2 ring-gray-700 ring-offset-2'
                : 'border-gray-300 hover:scale-105 hover:border-gray-950 hover:shadow-sm',
              {
                'cursor-not-allowed opacity-40': opt.disabled,
              }
            )}
            aria-selected={isSelected}
            aria-label={opt.label}
            title={opt.label}
            style={{ backgroundColor: opt.swatch }}
          />
        )
      })}
    </div>
  )
}
