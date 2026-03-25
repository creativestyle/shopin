'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { ProductSearchBffService, type ProductSearchParams } from '@/lib/bff/services/product-search-service'
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
  const serviceRef = useRef<ProductSearchBffService | null>(null)

  if (!serviceRef.current) {
    serviceRef.current = new ProductSearchBffService(bffFetch)
  }

  // Serialize params for dependency comparison
  const paramsKey = JSON.stringify(params ?? {})

  const search = useCallback(
    async (searchQuery: string) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setIsLoading(true)
      try {
        const data =
          await serviceRef.current!.searchProducts({
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paramsKey]
  )

  useEffect(() => {
    if (query.length < MIN_QUERY_LENGTH) {
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
