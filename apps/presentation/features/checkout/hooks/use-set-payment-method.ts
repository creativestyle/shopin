'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCheckoutService } from './use-checkout-service'
import type { SetPaymentMethodRequest } from '@core/contracts/cart/payment-method'
import type { CartResponse } from '@core/contracts/cart/cart'
import { cartKeys } from '@/features/cart/cart-keys'
import { checkoutKeys } from '../checkout-keys'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'

export function useSetPaymentMethod() {
  const { checkoutService } = useCheckoutService()
  const queryClient = useQueryClient()
  const t = useTranslations('checkout.payment')

  const mutation = useBffClientMutation({
    mutationKey: checkoutKeys.mutations.setPaymentMethod(),
    errorMessage: t('saveError'),
    mutationFn: async (request: SetPaymentMethodRequest) => {
      return await checkoutService.setPaymentMethod(request)
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.all, cart)
    },
  })

  const handleSetPaymentMethod = async (
    request: SetPaymentMethodRequest
  ): Promise<CartResponse | null> => {
    const result = await mutation.mutateAsync(request)
    return result.success ? result.data : null
  }

  return {
    handleSetPaymentMethod,
    isPending: mutation.isPending,
  }
}
