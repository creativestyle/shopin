'use client'

import { useQueryClient } from '@tanstack/react-query'
import { type CartResponse } from '@core/contracts/cart/cart'
import { useCheckoutService } from './use-checkout-service'
import { cartKeys } from '@/features/cart/cart-keys'
import { checkoutKeys, shippingMethodsKeys } from '../checkout-keys'
import type {
  AddressBase,
  AddressType,
} from '@core/contracts/address/address-base'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'

interface UseSetAddressOptions {
  addressType: AddressType
}

export function useSetAddress({ addressType }: UseSetAddressOptions) {
  const { checkoutService } = useCheckoutService()
  const queryClient = useQueryClient()
  const t = useTranslations('checkout')

  const mutation = useBffClientMutation({
    mutationKey: checkoutKeys.mutations.setAddress(),
    errorMessage: t(`${addressType}.saveError`),
    mutationFn: async (request: AddressBase) => {
      if (addressType === 'shipping') {
        return await checkoutService.setShippingAddress(request)
      } else {
        return await checkoutService.setBillingAddress(request)
      }
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(cartKeys.all, cart)
      if (addressType === 'shipping') {
        queryClient.invalidateQueries({
          queryKey: shippingMethodsKeys.all,
        })
      }
    },
  })

  const handleSetAddress = async (
    request: AddressBase
  ): Promise<CartResponse | null> => {
    const result = await mutation.mutateAsync(request)
    return result.success ? result.data : null
  }

  return {
    handleSetAddress,
    isPending: mutation.isPending,
  }
}
