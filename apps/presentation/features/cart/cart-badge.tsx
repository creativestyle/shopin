'use client'

import { useCart } from './cart-use-cart'
import { cn } from '@/lib/utils'

interface CartBadgeProps {
  className?: string
}

/**
 * Client component that displays the cart item count badge
 */
export function CartBadge({ className }: CartBadgeProps) {
  const { cart, isLoading, error } = useCart()
  const itemCount = cart?.itemCount ?? 0

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
