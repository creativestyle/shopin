'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import HeartIcon from '@/public/icons/heart.svg'
import HeartFilledIcon from '@/public/icons/heart-filled.svg'
import { useWishlistOperations } from './hooks/use-wishlist-operations'
import { useWishlistProductIds } from './hooks/use-wishlist-product-ids'
import { getWishlistItemKey } from './lib/get-wishlist-item-key'

interface AddToWishlistProps {
  className?: string
  productId: string
  variantId?: string
}

export function AddToWishlist({
  className,
  productId,
  variantId,
}: AddToWishlistProps) {
  const t = useTranslations('product.buyBox')
  const { toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlistOperations()
  const { productKeys } = useWishlistProductIds()

  // Check if this specific product variant is in wishlist
  const wishlistKey = getWishlistItemKey(productId, variantId)
  const isInWishlistOnServer = productKeys.has(wishlistKey)
  const [isInWishlist, setIsInWishlist] = useState(isInWishlistOnServer)

  // Sync local state when server state changes
  useEffect(() => {
    setIsInWishlist(isInWishlistOnServer)
  }, [isInWishlistOnServer])

  const handleClick = async () => {
    const isPending = isAddingToWishlist || isRemovingFromWishlist
    if (isPending) {
      return
    }

    const previousState = isInWishlist

    try {
      // Optimistically update UI
      setIsInWishlist(!previousState)

      // Perform the action - use variantId if available, otherwise use productId
      await toggleWishlist(productId, previousState, variantId)
    } catch (error) {
      // Revert on error
      setIsInWishlist(previousState)
    }
  }

  return (
    <div className={className}>
      <Button
        variant='secondary'
        scheme='black'
        onClick={handleClick}
        className='w-full'
        aria-label={
          isInWishlist ? t('wishlistRemoveAria') : t('wishlistSaveAria')
        }
        disabled={isAddingToWishlist || isRemovingFromWishlist}
      >
        {isInWishlist ? (
          <HeartFilledIcon className='size-5' />
        ) : (
          <HeartIcon className='size-5' />
        )}
      </Button>
    </div>
  )
}
