'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { CheckoutService } from '../lib/checkout-bff-service'

/**
 * Returns the checkout BFF service for the current client.
 * Internal to checkout feature; use checkout hooks from outside.
 */
export function useCheckoutService() {
  const bffFetch = useBffFetchClient()
  return { checkoutService: new CheckoutService(bffFetch) }
}
