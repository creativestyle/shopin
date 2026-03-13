'use client'

import { cn } from '@/lib/utils'
import type { FacetTerm } from '@core/contracts/product-collection/facet'

interface ColorFilterOptionsProps {
  terms: FacetTerm[]
  selectedValues: string[]
  facetName: string
  onToggle: (facetName: string, value: string) => void
}

export function ColorFilterOptions({
  terms,
  selectedValues,
  facetName,
  onToggle,
}: ColorFilterOptionsProps) {
  return (
    <div className='grid grid-cols-4 gap-4'>
      {terms.map((term) => {
        const isSelected = selectedValues.includes(term.term)
        const swatch = term.colorHex ?? '#888'
        return (
          <button
            key={term.term}
            type='button'
            onClick={() => onToggle(facetName, term.term)}
            className='flex cursor-pointer flex-col items-center gap-1'
          >
            <div
              className={cn(
                'size-7 rounded-full border transition-all',
                isSelected
                  ? 'border-2 border-gray-950'
                  : 'border-gray-300 hover:scale-105 hover:border-gray-950'
              )}
              style={{ backgroundColor: swatch }}
            />
            <span className='text-xs text-gray-700'>{term.label}</span>
          </button>
        )
      })}
    </div>
  )
}
