'use client'

import { useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { LineItemResponse } from '@core/contracts/cart/cart'

interface CartItemRemovalConfirmationProps {
  item: LineItemResponse
  onConfirm: () => void
  onCancel: () => void
  isRemoving: boolean
}

export function CartItemRemovalConfirmation({
  item,
  onConfirm,
  onCancel,
  isRemoving,
}: CartItemRemovalConfirmationProps) {
  const t = useTranslations('cart')
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus the confirm button when confirmation appears for accessibility
  useEffect(() => {
    confirmButtonRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div
      role='alertdialog'
      aria-labelledby='removal-confirmation-title'
      aria-describedby='removal-confirmation-description'
      aria-modal='true'
      className='absolute inset-0 z-10 flex flex-col items-center justify-center border border-gray-400 bg-white/90 px-4 py-6 shadow-sm'
      onKeyDown={handleKeyDown}
    >
      <p
        id='removal-confirmation-title'
        className='mb-4 text-center text-sm/[1.6] font-bold text-gray-950 md:text-base'
      >
        {t('item.removeConfirmation.message', { name: item.name })}
      </p>
      <div className='flex gap-3'>
        <button
          onClick={onCancel}
          disabled={isRemoving}
          className='flex items-center justify-center rounded border border-black bg-white px-6 py-2 text-sm/[1.6] font-normal text-black transition-opacity hover:opacity-90 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          aria-label={t('item.removeConfirmation.cancel')}
        >
          <span>{t('item.removeConfirmation.cancel')}</span>
        </button>
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          disabled={isRemoving}
          className='flex items-center justify-center rounded border border-black bg-white px-6 py-2 text-sm/[1.6] font-normal text-black transition-opacity hover:opacity-90 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          aria-label={t('item.removeConfirmation.confirm')}
        >
          <span>
            {isRemoving
              ? t('item.removeConfirmation.removing')
              : t('item.removeConfirmation.confirm')}
          </span>
        </button>
      </div>
      <p
        id='removal-confirmation-description'
        className='sr-only'
      >
        {t('item.removeConfirmation.description')}
      </p>
    </div>
  )
}
