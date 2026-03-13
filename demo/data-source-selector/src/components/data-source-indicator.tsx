'use client'

import { useState, useEffect } from 'react'
import type { DataSource } from '@config/constants'
import { DEFAULT_DATA_SOURCE } from '@config/constants'
import { DATA_SOURCE_LABELS, DATA_SOURCE_COLORS } from '../demo-constants'
import { getDataSourceFromCookie } from '../utils/cookies'

export function DataSourceIndicator() {
  const [dataSource, setDataSource] = useState<DataSource>(DEFAULT_DATA_SOURCE)

  useEffect(() => {
    // Initialize from cookie
    const stored = getDataSourceFromCookie()
    if (stored) {
      setDataSource(stored)
    }

    // Listen for cookie changes
    const checkCookie = () => {
      const current = getDataSourceFromCookie()
      if (current) {
        setDataSource(current)
      }
    }

    // Check every second for cookie changes
    const interval = setInterval(checkCookie, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className='fixed top-0 right-0 z-50 inline-flex items-center justify-center transition-all duration-200 box-border cursor-pointer px-2 py-1 text-sm font-bold leading-tight bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-100 shadow-sm'>
      <div
        className='w-2 h-2 rounded-full mr-2'
        style={{ backgroundColor: DATA_SOURCE_COLORS[dataSource] }}
      />
      <span className='text-xs font-medium'>
        {DATA_SOURCE_LABELS[dataSource]}
      </span>
    </div>
  )
}
