'use client'

import { useQuery } from '@tanstack/react-query'
import { useCheckoutService } from './use-checkout-service'
import type { ShippingMethodsResponse } from '@core/contracts/cart/shipping-method'
import { shippingMethodsKeys } from '../checkout-keys'

export { shippingMethodsKeys }

export function useShippingMethods(enabled: boolean = true) {
  const { checkoutService } = useCheckoutService()

  return useQuery({
    queryKey: shippingMethodsKeys.all,
    queryFn: async (): Promise<ShippingMethodsResponse> => {
      return await checkoutService.getShippingMethods()
    },
    enabled,
  })
}
