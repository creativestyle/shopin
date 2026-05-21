'use client'

import { Checkbox } from '@/components/ui/checkbox'
import type { FacetTerm } from '@core/contracts/product-collection/facet'

interface CheckboxFilterOptionsProps {
  terms: FacetTerm[]
  selectedValues: string[]
  facetName: string
  onToggle: (facetName: string, value: string) => void
}

const slugForId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'value'

export function CheckboxFilterOptions({
  terms,
  selectedValues,
  facetName,
  onToggle,
}: CheckboxFilterOptionsProps) {
  return (
    <div className='flex flex-col gap-3'>
      {terms.map((term, index) => {
        const isSelected = selectedValues.includes(term.term)
        const termSlug = slugForId(term.term)
        const checkboxId = `filter-${facetName}-${termSlug}-${index}`
        const labelId = `${checkboxId}-label`
        return (
          <label
            key={term.term}
            className='flex cursor-pointer items-center gap-3'
          >
            <Checkbox
              id={checkboxId}
              aria-labelledby={labelId}
              checked={isSelected}
              onCheckedChange={() => onToggle(facetName, term.term)}
            />
            <span
              id={labelId}
              className='text-sm text-gray-700'
            >
              {term.label} ({term.count})
            </span>
          </label>
        )
      })}
    </div>
  )
}
