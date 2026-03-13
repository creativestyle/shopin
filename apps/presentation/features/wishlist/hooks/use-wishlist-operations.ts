'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWishlistService } from './use-wishlist-service'
import { addToast } from '@/components/ui/toast'
import { useTranslations } from 'next-intl'
import { wishlistKeys } from '../wishlist-keys'

/**
 * Hook for wishlist operations
 * Uses client-side fetch with credentials
 */
export function useWishlistOperations() {
  const { wishlistService } = useWishlistService()
  const queryClient = useQueryClient()
  const t = useTranslations('wishlist')

  const addMutation = useMutation({
    mutationKey: wishlistKeys.mutations.add(),
    mutationFn: async (request: { productId?: string; variantId?: string }) => {
      return await wishlistService.addItem(request)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
      addToast({
        type: 'success',
        children: t('addSuccess'),
      })
    },
    onError: () => {
      addToast({
        type: 'error',
        children: t('addError'),
      })
    },
  })

  const removeMutation = useMutation({
    mutationKey: wishlistKeys.mutations.remove(),
    mutationFn: async ({ lineItemId }: { lineItemId: string }) => {
      return await wishlistService.removeItem({ lineItemId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.all })
      addToast({
        type: 'success',
        children: t('removeSuccess'),
      })
    },
    onError: () => {
      addToast({
        type: 'error',
        children: t('removeError'),
      })
    },
  })

  const toggleWishlist = async (
    productId: string,
    currentIsInWishlist: boolean,
    variantId?: string
  ) => {
    if (currentIsInWishlist) {
      // Need to find the lineItemId for this product variant
      const wishlistData = queryClient.getQueryData(
        wishlistKeys.productIds()
      ) as Awaited<ReturnType<typeof wishlistService.getWishlist>> | null

      // Match by variantId if available, otherwise by productId
      const item = wishlistData?.items.find((i) => {
        if (variantId && i.product.variantId) {
          return i.product.variantId === variantId && i.product.id === productId
        }
        return i.product.id === productId
      })
      if (item) {
        await removeMutation.mutateAsync({ lineItemId: item.id })
      }
    } else {
      // Use variantId if available, otherwise use productId
      await addMutation.mutateAsync(
        variantId ? { productId, variantId } : { productId }
      )
    }
  }

  return {
    toggleWishlist,
    isAddingToWishlist: addMutation.isPending,
    isRemovingFromWishlist: removeMutation.isPending,
  }
}
