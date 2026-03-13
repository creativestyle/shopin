'use client'

import { useQuery } from '@tanstack/react-query'
import { useOrderService } from '@/features/order/use-order-service'
import type { OrderResponse } from '@core/contracts/order/order'
import { checkoutKeys } from '../checkout-keys'

interface UseGetOrderProps {
  orderId: string | undefined
  enabled: boolean
}

export function useGetOrder({ orderId, enabled }: UseGetOrderProps) {
  const { orderService } = useOrderService()

  return useQuery({
    queryKey: [...checkoutKeys.all, 'order', orderId],
    queryFn: async (): Promise<OrderResponse> => {
      if (!orderId) {
        throw new Error('Order ID is required')
      }
      return await orderService.getOrder(orderId)
    },
    enabled,
  })
}
