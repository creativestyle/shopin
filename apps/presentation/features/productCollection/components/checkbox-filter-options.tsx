'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { FacetTerm } from '@core/contracts/product-collection/facet'

interface CheckboxFilterOptionsProps {
  terms: FacetTerm[]
  selectedValues: string[]
  facetName: string
  onToggle: (facetName: string, value: string) => void
}

export function CheckboxFilterOptions({
  terms,
  selectedValues,
  facetName,
  onToggle,
}: CheckboxFilterOptionsProps) {
  return (
    <div className='flex flex-col gap-3'>
      {terms.map((term) => {
        const isSelected = selectedValues.includes(term.term)
        const checkboxId = `filter-${facetName}-${term.term}`
        return (
          <label
            key={term.term}
            htmlFor={checkboxId}
            className='flex cursor-pointer items-center gap-3'
          >
            <Checkbox
              id={checkboxId}
              checked={isSelected}
              onCheckedChange={() => onToggle(facetName, term.term)}
            />
            <span className='text-sm text-gray-700'>
              {term.label} ({term.count})
            </span>
          </label>
        )
      })}
    </div>
  )
}
