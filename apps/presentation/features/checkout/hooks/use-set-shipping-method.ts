'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCheckoutService } from './use-checkout-service'
import { cartKeys } from '@/features/cart/cart-keys'
import { checkoutKeys } from '../checkout-keys'
import type { SetShippingMethodRequest } from '@core/contracts/cart/shipping-method'
import type { CartResponse } from '@core/contracts/cart/cart'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'

export function useSetShippingMethod() {
  const { checkoutService } = useCheckoutService()
  const queryClient = useQueryClient()
  const t = useTranslations('checkout.deliveryMethod')

  const mutation = useBffClientMutation({
    mutationKey: checkoutKeys.mutations.setShippingMethod(),
    errorMessage: t('saveError'),
    mutationFn: async (request: SetShippingMethodRequest) => {
      return await checkoutService.setShippingMethod(request)
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.all, cart)
    },
  })

  const handleSetShippingMethod = async (
    request: SetShippingMethodRequest
  ): Promise<CartResponse | null> => {
    const result = await mutation.mutateAsync(request)
    return result.success ? result.data : null
  }

  return {
    handleSetShippingMethod,
    isPending: mutation.isPending,
  }
}
