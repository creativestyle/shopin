'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { FacetTerm } from '@core/contracts/product-collection/facet'

const SIZE_FILTER_MAX = 10

interface SizeFilterOptionsProps {
  terms: FacetTerm[]
  selectedValues: string[]
  facetName: string
  onToggle: (facetName: string, value: string) => void
}

export function SizeFilterOptions({
  terms,
  selectedValues,
  facetName,
  onToggle,
}: SizeFilterOptionsProps) {
  const t = useTranslations('productCollection')
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleTerms = isExpanded ? terms : terms.slice(0, SIZE_FILTER_MAX)

  return (
    <div className='flex flex-wrap gap-2'>
      {visibleTerms.map((term) => {
        const isSelected = selectedValues.includes(term.term)
        return (
          <button
            key={term.term}
            type='button'
            onClick={() => onToggle(facetName, term.term)}
            className={cn(
              'flex h-10 min-w-12 cursor-pointer items-center justify-center rounded border px-3 text-sm transition-all',
              isSelected
                ? 'border-2 border-gray-950 bg-white font-medium text-gray-950'
                : 'border-gray-200 text-gray-700 hover:scale-[1.02] hover:border-gray-950'
            )}
          >
            {term.label}
          </button>
        )
      })}
      {!isExpanded && terms.length > SIZE_FILTER_MAX && (
        <button
          type='button'
          onClick={() => setIsExpanded(true)}
          className='flex h-10 cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 px-3 text-sm text-gray-500 hover:border-gray-950 hover:text-gray-700'
        >
          {t('filters.sizeShowMore' as Parameters<typeof t>[0], {
            count: terms.length - SIZE_FILTER_MAX,
          })}
        </button>
      )}
      {isExpanded && terms.length > SIZE_FILTER_MAX && (
        <button
          type='button'
          onClick={() => setIsExpanded(false)}
          className='w-full pt-1 text-left text-sm text-gray-500 hover:text-gray-700'
        >
          {t('filters.sizeShowLess' as Parameters<typeof t>[0])}
        </button>
      )}
    </div>
  )
}
