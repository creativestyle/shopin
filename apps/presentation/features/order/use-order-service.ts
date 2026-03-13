'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { OrderService } from './lib/order-service'

/**
 * Returns the order BFF service instance for the current client.
 * Internal to order feature; use order hooks from outside.
 */
export function useOrderService() {
  const bffFetch = useBffFetchClient()
  return { orderService: new OrderService(bffFetch) }
}
