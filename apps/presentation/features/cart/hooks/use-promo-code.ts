'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useCartService } from './use-cart-service'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { cartKeys } from '../cart-keys'
import { PromoCodeError } from '../lib/promo-code-error'
import type { CartResponse } from '@core/contracts/cart/cart'

type PromoCodeFeedback =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null

export function usePromoCode() {
  const { cartService } = useCartService()
  const queryClient = useQueryClient()
  const t = useTranslations('cart.promoCode')
  const [feedback, setFeedback] = useState<PromoCodeFeedback>(null)

  const updateCart = async (data: CartResponse) => {
    await queryClient.cancelQueries({ queryKey: cartKeys.all, exact: true })
    queryClient.setQueryData(cartKeys.all, data)
  }

  // errorMessage: null — the message is shown inline and announced, not in a toast.
  const applyMutation = useBffClientMutation({
    mutationKey: cartKeys.mutations.applyDiscountCode(),
    errorMessage: null,
    mutationFn: async (request: { code: string }) => {
      return await cartService.applyDiscountCode(request)
    },
    onSuccess: async (data) => {
      await updateCart(data)
      setFeedback({ type: 'success', message: t('success') })
    },
    onError: (error: unknown) => {
      const reason = error instanceof PromoCodeError ? error.reason : null
      setFeedback({
        type: 'error',
        message: reason ? t(`errors.${reason}`) : t('errors.generic'),
      })
    },
  })

  const removeMutation = useBffClientMutation({
    mutationKey: cartKeys.mutations.removeDiscountCode(),
    errorMessage: null,
    mutationFn: async (request: { discountCodeId: string }) => {
      return await cartService.removeDiscountCode(request)
    },
    onSuccess: async (data) => {
      await updateCart(data)
      setFeedback({ type: 'success', message: t('removed') })
    },
    onError: () => {
      setFeedback({ type: 'error', message: t('errors.generic') })
    },
  })

  return {
    applyCode: applyMutation.mutateAsync,
    removeCode: removeMutation.mutateAsync,
    isApplying: applyMutation.isPending,
    isRemoving: removeMutation.isPending,
    feedback,
    clearFeedback: () => setFeedback(null),
  }
}
