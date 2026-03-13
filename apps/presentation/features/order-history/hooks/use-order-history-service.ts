'use client'

import { useBffFetchClient } from '@/lib/bff/core/bff-fetch-client'
import { OrderHistoryService } from '../lib/order-history-service'

export function useOrderHistoryService() {
  const bffFetch = useBffFetchClient()
  return { orderHistoryService: new OrderHistoryService(bffFetch) }
}
