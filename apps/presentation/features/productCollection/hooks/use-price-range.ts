'use client'

import { useState, useCallback } from 'react'
import type { PriceRange } from '@core/contracts/product-collection/product-collection'

export function usePriceRange(
  priceRange: PriceRange | undefined,
  currentPriceMin: number | undefined,
  currentPriceMax: number | undefined,
  onPriceRangeApply: (
    localMin: number,
    localMax: number,
    rangeMin: number,
    rangeMax: number
  ) => void
) {
  const minPrice = priceRange?.minPriceInCents ?? 0
  const maxPrice = priceRange?.maxPriceInCents ?? 100000
  const [localPriceMin, setLocalPriceMin] = useState(
    currentPriceMin ?? minPrice
  )
  const [localPriceMax, setLocalPriceMax] = useState(
    currentPriceMax ?? maxPrice
  )
  const [prev, setPrev] = useState({
    currentPriceMin,
    currentPriceMax,
    minPrice,
    maxPrice,
  })

  if (
    prev.currentPriceMin !== currentPriceMin ||
    prev.currentPriceMax !== currentPriceMax ||
    prev.minPrice !== minPrice ||
    prev.maxPrice !== maxPrice
  ) {
    setPrev({ currentPriceMin, currentPriceMax, minPrice, maxPrice })
    setLocalPriceMin(currentPriceMin ?? minPrice)
    setLocalPriceMax(currentPriceMax ?? maxPrice)
  }

  const applyPriceRange = useCallback(() => {
    onPriceRangeApply(localPriceMin, localPriceMax, minPrice, maxPrice)
  }, [localPriceMin, localPriceMax, minPrice, maxPrice, onPriceRangeApply])

  return {
    minPrice,
    maxPrice,
    localPriceMin,
    localPriceMax,
    setLocalPriceMin,
    setLocalPriceMax,
    applyPriceRange,
  }
}
