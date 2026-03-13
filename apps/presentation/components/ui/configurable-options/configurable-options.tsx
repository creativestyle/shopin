'use client'

import React from 'react'
import type { BaseOptionItemResponse } from '@core/contracts/product/option-item'
import type { ConfigurableOptionResponse } from '@core/contracts/product/configurable-option'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import { cn } from '@/lib/utils'
import { getSelectorComponent } from './selectors/selector-registry'
import { useConfigurableSelection } from './use-configurable-selection'

type EnhancedOptionItem = BaseOptionItemResponse & { disabled: boolean }
type EnhancedOptionsMap = Record<string, EnhancedOptionItem[]>

export interface ConfigurableOptionsProps {
  options: ConfigurableOptionResponse[]
  selected?: Record<string, string>
  onChangeOption?: (key: string, value: string) => void
  className?: string
  variants?: ProductDetailsResponse['variants']
  layout?: 'inline' | 'grid'
}

export const ConfigurableOptions: React.FC<ConfigurableOptionsProps> = ({
  options,
  selected,
  onChangeOption,
  className,
  variants,
  layout = 'inline',
}) => {
  const resolvedOptions = options ?? []
  const { selection, handleChange, isCandidateAvailable } =
    useConfigurableSelection(resolvedOptions, variants)

  if (options.length === 0) {
    return null
  }

  const currentSelection = selected ?? selection

  const enhancedOptionsMap = resolvedOptions.reduce<EnhancedOptionsMap>(
    (acc, optionDef) => {
      acc[optionDef.key] = optionDef.options.map<EnhancedOptionItem>(
        (option) => ({
          ...option,
          disabled: !isCandidateAvailable(
            optionDef.key,
            option.label,
            currentSelection
          ),
        })
      )
      return acc
    },
    {}
  )

  const getValue = (key: string) => currentSelection?.[key]
  const onChange = (key: string, value: string) => {
    onChangeOption?.(key, value)
    if (!selected) {
      handleChange(key, value)
    }
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {resolvedOptions.map((optionDefinition) => {
        const selectedValue = getValue(optionDefinition.key)
        const selectedLabel = optionDefinition.options.find(
          (optionCandidate) => optionCandidate.label === selectedValue
        )?.label

        const SelectorComponent = getSelectorComponent(optionDefinition.type)
        const enhancedOptions = enhancedOptionsMap[optionDefinition.key]

        if (!enhancedOptions) {
          return null
        }

        return (
          <div
            key={optionDefinition.key}
            className='flex flex-col gap-2'
          >
            <div className='text-sm'>
              <span>{optionDefinition.label}</span>
              {selectedLabel && (
                <>
                  : <span className='text-gray-500'>{selectedLabel}</span>
                </>
              )}
            </div>
            <SelectorComponent
              options={enhancedOptions}
              value={selectedValue}
              onChange={(nextValue) =>
                onChange(optionDefinition.key, nextValue)
              }
              layout={layout}
            />
          </div>
        )
      })}
    </div>
  )
}
