'use client'

import { useQuery } from '@tanstack/react-query'
import { useOrderHistoryService } from './use-order-history-service'
import { orderHistoryKeys } from '../order-history-keys'

export function useOrderDetail(orderId: string, enabled: boolean = true) {
  const { orderHistoryService } = useOrderHistoryService()

  const queryFn = async () => {
    return await orderHistoryService.getOrder(orderId)
  }

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: orderHistoryKeys.detail(orderId),
    queryFn,
    enabled: enabled && !!orderId,
  })

  return {
    order: order ?? undefined,
    isLoading,
    error,
  }
}
