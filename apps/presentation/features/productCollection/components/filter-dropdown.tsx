'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'
import type { Facet } from '@core/contracts/product-collection/facet'

interface FilterDropdownProps {
  facet: Facet
  selectedValues: string[]
  onToggle: (facetName: string, value: string) => void
  className?: string
}

export function FilterDropdown({
  facet,
  selectedValues,
  onToggle,
  className,
}: FilterDropdownProps) {
  const isColorFacet = facet.displayType === 'color'
  const isSizeFacet = facet.displayType === 'size'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex h-10 cursor-pointer items-center gap-1 rounded-3xl bg-gray-100 px-3 text-sm font-bold',
            className
          )}
          aria-label={facet.label}
        >
          <span>{facet.label}</span>
          <ChevronDownIcon className='h-4 w-4 shrink-0' />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'z-50 overflow-hidden rounded-md border bg-white p-2 shadow-md',
            isColorFacet || isSizeFacet ? 'min-w-[220px]' : 'min-w-[180px]'
          )}
          sideOffset={5}
        >
          {isColorFacet ? (
            <div className='grid grid-cols-4 gap-3 p-2'>
              {facet.terms.map((term) => {
                const isSelected = selectedValues.includes(term.term)
                const swatch = term.colorHex ?? '#888'
                return (
                  <DropdownMenu.Item
                    key={term.term}
                    className='flex cursor-pointer flex-col items-center gap-1 rounded outline-none focus:bg-gray-50'
                    onSelect={(e) => {
                      e.preventDefault()
                      onToggle(facet.name, term.term)
                    }}
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
                  </DropdownMenu.Item>
                )
              })}
            </div>
          ) : isSizeFacet ? (
            <div className='flex flex-wrap gap-2 p-2'>
              {facet.terms.map((term) => {
                const isSelected = selectedValues.includes(term.term)
                return (
                  <DropdownMenu.Item
                    key={term.term}
                    className='outline-none'
                    onSelect={(e) => {
                      e.preventDefault()
                      onToggle(facet.name, term.term)
                    }}
                  >
                    <div
                      className={cn(
                        'flex h-10 min-w-12 cursor-pointer items-center justify-center rounded border px-3 text-sm transition-all',
                        isSelected
                          ? 'border-2 border-gray-950 bg-white font-medium text-gray-950'
                          : 'border-gray-200 text-gray-700 hover:scale-[1.02] hover:border-gray-950'
                      )}
                    >
                      {term.label}
                    </div>
                  </DropdownMenu.Item>
                )
              })}
            </div>
          ) : (
            facet.terms.map((term) => {
              const isChecked = selectedValues.includes(term.term)
              return (
                <DropdownMenu.Item
                  key={term.term}
                  className='relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-gray-100 focus:bg-gray-100'
                  onSelect={(e) => {
                    e.preventDefault()
                    onToggle(facet.name, term.term)
                  }}
                >
                  <Checkbox
                    checked={isChecked}
                    className='pointer-events-none'
                  />
                  <span>
                    {term.label} ({term.count})
                  </span>
                </DropdownMenu.Item>
              )
            })
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
