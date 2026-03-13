'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import HeartIcon from '@/public/icons/heart.svg'
import HeartFilledIcon from '@/public/icons/heart-filled.svg'
import { cn } from '@/lib/utils'
import { useWishlistOperations } from './hooks/use-wishlist-operations'
import { useWishlistProductIds } from './hooks/use-wishlist-product-ids'
import { getWishlistItemKey } from './lib/get-wishlist-item-key'

type WishlistToggleVariant = 'product-card' | 'cart'

interface WishlistToggleButtonProps {
  productId: string
  variantId?: string
  variant: WishlistToggleVariant
  showText?: boolean
  className?: string
}

export function WishlistToggleButton({
  productId,
  variantId,
  variant,
  showText = false,
  className,
}: WishlistToggleButtonProps) {
  const t = useTranslations('product.buyBox')
  const tCart = useTranslations('cart')
  const { toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlistOperations()
  const { productKeys } = useWishlistProductIds()

  const wishlistKey = getWishlistItemKey(productId, variantId)
  const isInWishlistOnServer = productKeys.has(wishlistKey)
  const [isInWishlist, setIsInWishlist] = useState(isInWishlistOnServer)

  useEffect(() => {
    setIsInWishlist(isInWishlistOnServer)
  }, [isInWishlistOnServer])

  const handleClick = async (e?: React.MouseEvent) => {
    if (variant === 'product-card') {
      e?.preventDefault()
      e?.stopPropagation()
    }

    const isPending = isAddingToWishlist || isRemovingFromWishlist
    if (isPending) {
      return
    }

    const previousState = isInWishlist
    try {
      setIsInWishlist(!previousState)
      await toggleWishlist(productId, previousState, variantId)
    } catch {
      setIsInWishlist(previousState)
    }
  }

  const isPending = isAddingToWishlist || isRemovingFromWishlist
  const labelText = isInWishlist
    ? t('wishlistRemoveAria')
    : tCart('item.addToWishlist')

  if (variant === 'product-card') {
    return (
      <button
        type='button'
        className={cn(
          'absolute top-1 right-1 z-2 flex size-8 cursor-pointer items-center justify-center rounded-full border border-gray-100 bg-white disabled:opacity-50 lg:top-2 lg:right-2',
          className
        )}
        onClick={handleClick}
        disabled={isPending}
        aria-label={
          isInWishlist ? t('wishlistRemoveAria') : t('wishlistSaveAria')
        }
      >
        {isInWishlist ? (
          <HeartFilledIcon className='size-4 text-gray-700' />
        ) : (
          <HeartIcon className='size-4 text-gray-700' />
        )}
      </button>
    )
  }

  return (
    <button
      type='button'
      onClick={() => handleClick()}
      disabled={isPending}
      className={cn(
        'flex cursor-pointer items-center',
        showText ? 'shrink-0 gap-2' : 'justify-center',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      aria-label={
        isInWishlist ? t('wishlistRemoveAria') : t('wishlistSaveAria')
      }
    >
      {isInWishlist ? (
        <HeartFilledIcon className='h-6 w-6 shrink-0 text-gray-700' />
      ) : (
        <HeartIcon className='h-6 w-6 shrink-0 text-gray-700' />
      )}
      {showText && (
        <span
          className={cn(
            'text-sm/[1.6] font-normal whitespace-pre text-gray-700',
            'underline decoration-solid underline-offset-auto'
          )}
        >
          {labelText}
        </span>
      )}
    </button>
  )
}
