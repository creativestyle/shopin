'use client'

import { useState, useEffect, useId } from 'react'
import type { DataSource } from '@config/constants'
import { DEFAULT_DATA_SOURCE } from '@config/constants'
import { getDataSourceFromCookie, setDataSourceCookie } from '../utils/cookies'

export interface DataSourceOption {
  value: DataSource
  name: string
  description: string
  selectAriaLabel: string
}

export interface DataSourceSelectorLabels {
  title: string
  intro: string
  select: string
  selected: string
  currentSelection: string
}

interface DataSourceSelectorProps {
  labels: DataSourceSelectorLabels
  options: readonly DataSourceOption[]
}

export function DataSourceSelector({
  labels,
  options,
}: DataSourceSelectorProps) {
  const [selectedDataSource, setSelectedDataSource] =
    useState<DataSource>(DEFAULT_DATA_SOURCE)
  const id = useId()
  const headingId = `${id}-heading`

  useEffect(() => {
    // Initialize from cookie
    const stored = getDataSourceFromCookie()
    if (stored) {
      setSelectedDataSource(stored)
    }
  }, [])

  const handleDataSourceChange = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource)
    setDataSourceCookie(dataSource)
    // Reload the page to apply the new data source
    window.location.reload()
  }

  const selectedName =
    options.find((option) => option.value === selectedDataSource)?.name ??
    selectedDataSource

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h2
        id={headingId}
        className='text-xl font-semibold mb-4'
      >
        {labels.title}
      </h2>
      <p className='text-gray-600 mb-4'>{labels.intro}</p>

      <div
        role='group'
        aria-labelledby={headingId}
        className='space-y-3'
      >
        {options.map((option) => {
          const isSelected = selectedDataSource === option.value
          const descriptionId = `${id}-${option.value}-description`

          return (
            <div
              key={option.value}
              className='flex items-center justify-between p-3 border border-gray-300 rounded-lg'
            >
              <div>
                <h3 className='font-medium'>{option.name}</h3>
                <p
                  id={descriptionId}
                  className='text-sm text-gray-500'
                >
                  {option.description}
                </p>
              </div>
              <button
                type='button'
                aria-pressed={isSelected}
                aria-label={option.selectAriaLabel}
                aria-describedby={descriptionId}
                className={`inline-flex items-center justify-center transition-all duration-200 box-border cursor-pointer px-6 py-3 text-sm font-bold leading-tight rounded-full ${
                  isSelected
                    ? 'bg-gray-200 text-gray-900 border-2 border-gray-700'
                    : 'bg-primary text-white hover:bg-secondary active:bg-primary shadow-sm'
                }`}
                onClick={() => handleDataSourceChange(option.value)}
              >
                {isSelected ? labels.selected : labels.select}
              </button>
            </div>
          )
        })}
      </div>

      <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
        <p
          role='status'
          className='text-sm text-blue-700'
        >
          <strong>{labels.currentSelection}</strong> {selectedName}
        </p>
      </div>
    </div>
  )
}
