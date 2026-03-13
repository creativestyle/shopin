'use client'

import { useQuery } from '@tanstack/react-query'
import { useWishlistService } from './use-wishlist-service'
import { wishlistKeys } from '../wishlist-keys'
import { getWishlistItemKey } from '../lib/get-wishlist-item-key'

/**
 * Hook for checking if products are in the wishlist.
 * Fetches with high limit to get all product IDs for membership checks.
 * Used by wishlist buttons/badges that need to know if specific products are wishlisted.
 */
export function useWishlistProductIds() {
  const { wishlistService } = useWishlistService()

  const {
    data: wishlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: wishlistKeys.productIds(),
    queryFn: async () => {
      // Fetch with high limit to get all items for membership checking
      return await wishlistService.getWishlist(1, 1000)
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: false,
  })

  // Create a Set with composite keys (variantId or productId)
  const productKeys = new Set(
    wishlist?.items.map((item) =>
      getWishlistItemKey(item.product.id, item.product.variantId)
    ) || []
  )

  return {
    productKeys,
    itemCount: wishlist?.itemCount ?? 0,
    isLoading,
    error,
  }
}
