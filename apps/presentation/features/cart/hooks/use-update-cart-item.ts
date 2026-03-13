'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCartService } from './use-cart-service'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'
import { cartKeys } from '../cart-keys'

export function useUpdateCartItem() {
  const { cartService } = useCartService()
  const queryClient = useQueryClient()
  const t = useTranslations('cart.errors')

  const mutation = useBffClientMutation({
    mutationKey: cartKeys.mutations.update(),
    errorMessage: t('updateItem'),
    mutationFn: async (request: { lineItemId: string; quantity: number }) => {
      return await cartService.updateItem(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })

  return {
    handleUpdate: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
