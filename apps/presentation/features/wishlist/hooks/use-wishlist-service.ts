'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { WishlistBffService } from '../lib/wishlist-bff-service'

/**
 * Returns the wishlist BFF service instance for the current client.
 * Internal to wishlist feature; use useWishlist from outside.
 */
export function useWishlistService() {
  const bffFetch = useBffFetchClient()
  return { wishlistService: new WishlistBffService(bffFetch) }
}
