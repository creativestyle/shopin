'use client'

import { useState } from 'react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { Facet } from '@core/contracts/product-collection/facet'
import { ColorFilterOptions } from './color-filter-options'
import { SizeFilterOptions } from './size-filter-options'
import { BrandSearchInput } from './brand-search-input'
import { CheckboxFilterOptions } from './checkbox-filter-options'

interface FacetAccordionItemProps {
  facet: Facet
  selectedValues: string[]
  onFilterToggle: (facetName: string, value: string) => void
}

export function FacetAccordionItem({
  facet,
  selectedValues,
  onFilterToggle,
}: FacetAccordionItemProps) {
  const selectedCount = selectedValues.length
  const hasSelectedValue = selectedCount > 0
  const isColorFacet = facet.displayType === 'color'
  const isBrandFacet = facet.name === 'brand'
  const isSizeFacet = facet.displayType === 'size'

  const selectedLabels = selectedValues
    .map((value) => {
      const label = facet.terms.find((t) => t.term === value)?.label || value
      return label
    })
    .filter(Boolean)
    .join(', ')

  const [brandSearchQuery, setBrandSearchQuery] = useState('')

  const filteredTerms =
    isBrandFacet && brandSearchQuery
      ? facet.terms.filter((term) =>
          term.label.toLowerCase().includes(brandSearchQuery.toLowerCase())
        )
      : facet.terms

  return (
    <AccordionItem value={facet.name}>
      <AccordionTrigger
        className='py-4 text-sm text-gray-950 normal-case'
        withArrow
      >
        <span>
          <span className={hasSelectedValue ? 'font-bold' : 'font-normal'}>
            {facet.label}
            {hasSelectedValue && ` (${selectedCount})`}
          </span>
          {hasSelectedValue && (
            <span className='font-normal text-gray-700'>
              : {selectedLabels}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent className='pt-2 pb-4'>
        {isBrandFacet && (
          <BrandSearchInput
            value={brandSearchQuery}
            onChange={setBrandSearchQuery}
          />
        )}

        {isColorFacet ? (
          <ColorFilterOptions
            terms={filteredTerms}
            selectedValues={selectedValues}
            facetName={facet.name}
            onToggle={onFilterToggle}
          />
        ) : isSizeFacet ? (
          <SizeFilterOptions
            terms={filteredTerms}
            selectedValues={selectedValues}
            facetName={facet.name}
            onToggle={onFilterToggle}
          />
        ) : (
          <CheckboxFilterOptions
            terms={filteredTerms}
            selectedValues={selectedValues}
            facetName={facet.name}
            onToggle={onFilterToggle}
          />
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
