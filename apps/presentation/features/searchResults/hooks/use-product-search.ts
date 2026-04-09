'use client'

import { useState, useEffect, useRef } from 'react'
import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import {
  ProductSearchBffService,
  type ProductSearchParams,
} from '../lib/product-search-service'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 3

interface UseProductSearchResult {
  results: ProductSearchResponse | null
  isLoading: boolean
}

export function useProductSearch(
  query: string,
  params?: Omit<ProductSearchParams, 'query'>
): UseProductSearchResult {
  const bffFetch = useBffFetchClient()
  const [results, setResults] = useState<ProductSearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const service = new ProductSearchBffService(bffFetch)

  const search = async (searchQuery: string) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    try {
      const data = await service.searchProducts({
        query: searchQuery,
        ...params,
      })
      if (!controller.signal.aborted) {
        setResults(data)
      }
    } catch {
      // Keep previous results visible on error
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      abortControllerRef.current?.abort()
      setResults(null)
      setIsLoading(false)
      return
    }

    const timeoutId = setTimeout(() => {
      search(query)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [query, search])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return { results, isLoading }
}
