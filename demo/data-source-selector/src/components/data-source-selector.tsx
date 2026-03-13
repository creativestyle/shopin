'use client'

import { useState, useEffect } from 'react'
import type { DataSource } from '@config/constants'
import { ALLOWED_DATA_SOURCES, DEFAULT_DATA_SOURCE } from '@config/constants'
import { DATA_SOURCE_DESCRIPTIONS } from '../demo-constants'
import { getDataSourceFromCookie, setDataSourceCookie } from '../utils/cookies'

export function DataSourceSelector() {
  const [selectedDataSource, setSelectedDataSource] =
    useState<DataSource>(DEFAULT_DATA_SOURCE)

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

  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h2 className='text-xl font-semibold mb-4'>Data Source Configuration</h2>
      <p className='text-gray-600 mb-4'>
        Select which data source the application should use for fetching
        products and navigation.
      </p>

      <div className='space-y-3'>
        {ALLOWED_DATA_SOURCES.map((source) => (
          <div
            key={source}
            className='flex items-center justify-between p-3 border border-gray-300 rounded-lg'
          >
            <div>
              <h3 className='font-medium capitalize'>{source}</h3>
              <p className='text-sm text-gray-500'>
                {DATA_SOURCE_DESCRIPTIONS[source]}
              </p>
            </div>
            <button
              className={`inline-flex items-center justify-center transition-all duration-200 box-border cursor-pointer px-6 py-3 text-sm font-bold leading-tight rounded-full ${
                selectedDataSource === source
                  ? 'bg-gray-200 text-gray-900 border-2 border-gray-700'
                  : 'bg-primary text-white hover:bg-secondary active:bg-primary shadow-sm'
              }`}
              onClick={() => handleDataSourceChange(source)}
            >
              {selectedDataSource === source ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
        <p className='text-sm text-blue-700'>
          <strong>Current selection:</strong> {selectedDataSource}
        </p>
      </div>
    </div>
  )
}
