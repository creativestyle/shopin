'use client'

import { useQuery } from '@tanstack/react-query'
import { useWishlistService } from './hooks/use-wishlist-service'
import { wishlistKeys } from './wishlist-keys'

interface UseWishlistOptions {
  page?: number
  limit?: number
}

export function useWishlist(options: UseWishlistOptions = {}) {
  const { page = 1, limit = 24 } = options
  const { wishlistService } = useWishlistService()

  const {
    data: wishlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: wishlistKeys.list(page, limit),
    queryFn: async () => {
      return await wishlistService.getWishlist(page, limit)
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    wishlist: wishlist ?? null,
    isLoading,
    error,
  }
}
