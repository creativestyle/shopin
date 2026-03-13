'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { CartService } from '../lib/cart-bff-service'

/**
 * Returns the cart BFF service instance for the current client.
 * Internal to cart feature; use cart-use-cart / useAddToCart / etc. from outside.
 */
export function useCartService() {
  const bffFetch = useBffFetchClient()
  return { cartService: new CartService(bffFetch) }
}
