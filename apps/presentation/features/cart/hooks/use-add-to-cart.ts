'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCartService } from './use-cart-service'
import { useAddToCartModal } from '../cart-add-to-cart-modal-provider'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useTranslations } from 'next-intl'
import { cartKeys } from '../cart-keys'

export function useAddToCart() {
  const { cartService } = useCartService()
  const queryClient = useQueryClient()
  const { setOpen } = useAddToCartModal()
  const tCart = useTranslations('cart.errors')

  const mutation = useBffClientMutation({
    mutationKey: cartKeys.mutations.add(),
    errorMessage: tCart('addToCart'),
    mutationFn: async ({
      productId,
      variantId,
      quantity,
    }: {
      productId: string
      variantId?: string
      quantity: number
    }) => {
      return await cartService.addItem({
        productId,
        variantId,
        quantity,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.all })
      setOpen(true)
    },
  })

  const handleAddToCart = async (params: {
    productId: string
    quantity?: number
    variantId?: string
  }) => {
    await mutation.mutateAsync({ ...params, quantity: params.quantity ?? 1 })
  }

  return {
    handleAddToCart,
    isPending: mutation.isPending,
  }
}
