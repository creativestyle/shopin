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
  const serviceRef = useRef(new ProductSearchBffService(bffFetch))

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
      abortControllerRef.current?.abort()
      return
    }

    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsLoading(true)
      serviceRef.current
        .searchProducts({
          query,
          ...params,
        })
        .then((data) => {
          if (!controller.signal.aborted) {
            setResults(data)
          }
        })
        .catch(() => {
          // Keep previous results visible on error
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false)
          }
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [query, params])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const shouldSearch = query.length >= MIN_QUERY_LENGTH

  return {
    results: shouldSearch ? results : null,
    isLoading: shouldSearch ? isLoading : false,
  }
}
