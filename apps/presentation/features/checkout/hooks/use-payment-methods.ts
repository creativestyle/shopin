'use client'

import { useQuery } from '@tanstack/react-query'
import { useCheckoutService } from './use-checkout-service'
import type { PaymentMethodsResponse } from '@core/contracts/cart/payment-method'
import { paymentMethodsKeys } from '../checkout-keys'

export { paymentMethodsKeys }

export function usePaymentMethods(enabled: boolean = true) {
  const { checkoutService } = useCheckoutService()

  return useQuery({
    queryKey: paymentMethodsKeys.all,
    queryFn: async (): Promise<PaymentMethodsResponse> => {
      return await checkoutService.getPaymentMethods()
    },
    enabled,
  })
}
