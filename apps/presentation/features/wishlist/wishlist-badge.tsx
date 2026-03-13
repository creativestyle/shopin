'use client'

import { useWishlistProductIds } from './hooks/use-wishlist-product-ids'
import { cn } from '@/lib/utils'

interface WishlistBadgeProps {
  className?: string
}

/**
 * Client component that displays the wishlist item count badge
 * Supports both authenticated users and guests (with anonymous sessions)
 */
export function WishlistBadge({ className }: WishlistBadgeProps) {
  const { itemCount, isLoading, error } = useWishlistProductIds()

  if (isLoading) {
    return null
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex h-4 min-w-3 items-center justify-center rounded-full bg-red-600',
          className
        )}
      >
        <span className='text-center text-xs leading-tight font-bold text-white'>
          !
        </span>
      </div>
    )
  }

  if (itemCount === 0) {
    return null
  }

  const displayText = itemCount >= 100 ? '99+' : itemCount

  return (
    <div
      className={cn(
        'flex h-4 min-w-3 items-center justify-center rounded-full bg-gray-950',
        { 'translate-x-2 px-1': itemCount >= 10 },
        className
      )}
    >
      <span className='text-center text-xs leading-none font-bold text-white'>
        {displayText}
      </span>
    </div>
  )
}
