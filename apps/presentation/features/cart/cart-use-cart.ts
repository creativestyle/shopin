'use client'

import { useQuery } from '@tanstack/react-query'
import { useCartService } from './hooks/use-cart-service'
import { cartKeys } from './cart-keys'

export function useCart() {
  const { cartService } = useCartService()

  const {
    data: cart,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: cartKeys.all,
    queryFn: async () => {
      return await cartService.getCart()
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    cart: cart ?? null,
    isLoading,
    error,
    refetch,
  }
}
