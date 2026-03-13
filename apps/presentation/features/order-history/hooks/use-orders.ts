'use client'

import { useQuery } from '@tanstack/react-query'
import { DEFAULT_ORDER_PAGE_SIZE } from '@core/contracts/order/order'
import { useOrderHistoryService } from './use-order-history-service'
import { orderHistoryKeys } from '../order-history-keys'

interface UseOrdersOptions {
  limit?: number
  page?: number
  enabled?: boolean
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { limit, page = 1, enabled = true } = options
  const { orderHistoryService } = useOrderHistoryService()

  const offset = (page - 1) * (limit ?? DEFAULT_ORDER_PAGE_SIZE)

  const queryFn = async () => {
    return await orderHistoryService.getOrders({ limit, offset })
  }

  const {
    data: ordersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: orderHistoryKeys.list(limit, offset),
    queryFn,
    enabled,
  })

  return {
    orders: ordersData?.orders ?? [],
    total: ordersData?.total ?? 0,
    offset: ordersData?.offset ?? offset,
    limit: ordersData?.limit ?? DEFAULT_ORDER_PAGE_SIZE,
    isLoading,
    error,
  }
}
