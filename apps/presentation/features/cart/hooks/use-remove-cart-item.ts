'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCartService } from './use-cart-service'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'
import { cartKeys } from '../cart-keys'

export function useRemoveCartItem() {
  const { cartService } = useCartService()
  const queryClient = useQueryClient()
  const t = useTranslations('cart.errors')

  const mutation = useBffClientMutation({
    mutationKey: cartKeys.mutations.remove(),
    errorMessage: t('removeItem'),
    mutationFn: async (request: { lineItemId: string }) => {
      return await cartService.removeItem(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })

  return {
    handleRemove: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
