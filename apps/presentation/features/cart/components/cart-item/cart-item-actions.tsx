'use client'

import TrashBinIcon from '@/public/icons/trash-bin.svg'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { WishlistToggleButton } from '@/features/wishlist/wishlist-toggle-button'

interface CartItemActionsProps {
  variant?: 'icon-only' | 'with-text'
  productId: string
  variantId?: string
  onRemoveClick?: () => void
  isRemoving?: boolean
}

export function CartItemActions({
  variant = 'icon-only',
  productId,
  variantId,
  onRemoveClick,
  isRemoving = false,
}: CartItemActionsProps) {
  const t = useTranslations('cart')
  const showText = variant === 'with-text'
  const removeLabel = showText ? t('item.removeAction') : t('item.remove')

  const buttons = (
    <>
      <button
        type='button'
        onClick={() => onRemoveClick?.()}
        disabled={isRemoving}
        className={cn(
          'flex cursor-pointer items-center',
          {
            'shrink-0 gap-2': showText,
            'justify-center': !showText,
          },
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
        aria-label={removeLabel}
      >
        <TrashBinIcon className='h-6 w-6 shrink-0 text-gray-700' />
        {showText && (
          <span
            className={cn(
              'text-sm/[1.6] font-normal whitespace-pre text-gray-700',
              'underline decoration-solid underline-offset-auto'
            )}
          >
            {removeLabel}
          </span>
        )}
      </button>
      {!showText && <div className='h-8 w-px bg-gray-300' />}
      <WishlistToggleButton
        productId={productId}
        variantId={variantId}
        variant='cart'
        showText={showText}
      />
    </>
  )

  return (
    <div
      className={cn({
        'flex items-start gap-8': showText,
        'relative h-8 w-24 shrink-0': !showText,
      })}
    >
      {showText ? (
        buttons
      ) : (
        <div className='absolute top-0 left-2.5 flex items-center gap-2.5'>
          {buttons}
        </div>
      )}
    </div>
  )
}
