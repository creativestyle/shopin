'use client'

import { useCheckoutService } from './use-checkout-service'
import { checkoutKeys } from '../checkout-keys'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'

export function useInitiatePayment() {
  const { checkoutService } = useCheckoutService()
  const t = useTranslations('checkout')

  const mutation = useBffClientMutation({
    mutationKey: checkoutKeys.mutations.initiatePayment(),
    errorMessage: t('paymentInitiationError', {
      default: 'Failed to initiate payment. Please try again.',
    }),
    mutationFn: async (cartId: string): Promise<{ paymentLink: string }> => {
      return await checkoutService.initiatePayment(cartId)
    },
  })

  const handleInitiatePayment = async (
    cartId: string
  ): Promise<{ paymentLink: string } | null> => {
    const result = await mutation.mutateAsync(cartId)
    return result.success ? result.data : null
  }

  return {
    handleInitiatePayment,
    isPending: mutation.isPending,
  }
}
