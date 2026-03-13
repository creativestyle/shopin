'use client'

import { useRef, useEffect, FC } from 'react'
import { useTranslations } from 'next-intl'
import type { AddressResponse } from '@core/contracts/customer/address'

interface CustomerAddressRemovalConfirmationProps {
  address: AddressResponse
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export const CustomerAddressRemovalConfirmation: FC<
  CustomerAddressRemovalConfirmationProps
> = ({ address, onConfirm, onCancel, isDeleting }) => {
  const t = useTranslations('account.myAccount')
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

  const addressLabel =
    [address.firstName, address.lastName, address.streetName, address.city]
      .filter(Boolean)
      .join(', ') || 'this address'

  return (
    <div
      role='alertdialog'
      aria-labelledby='removal-confirmation-title'
      aria-describedby='removal-confirmation-description'
      aria-modal='true'
      className='absolute inset-0 z-10 flex flex-col items-center justify-center rounded border border-gray-400 bg-white/90 px-4 py-6 shadow-sm'
      onKeyDown={handleKeyDown}
    >
      <p
        id='removal-confirmation-title'
        className='mb-4 text-center text-sm/[1.6] font-bold text-gray-950 md:text-base'
      >
        {t('addresses.deleteConfirmation', { addressLabel })}
      </p>
      <div className='flex gap-3'>
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className='flex items-center justify-center rounded border border-black bg-white px-6 py-2 text-sm/[1.6] font-normal text-black transition-opacity hover:opacity-90 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          aria-label={t('cancel')}
        >
          <span>{t('cancel')}</span>
        </button>
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          disabled={isDeleting}
          className='flex items-center justify-center rounded border border-black bg-white px-6 py-2 text-sm/[1.6] font-normal text-black transition-opacity hover:opacity-90 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:ring-offset-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          aria-label={t('addresses.delete')}
        >
          <span>
            {isDeleting ? t('addresses.deleting') : t('addresses.delete')}
          </span>
        </button>
      </div>
      <p
        id='removal-confirmation-description'
        className='sr-only'
      >
        {t('addresses.deleteConfirmationDescription')}
      </p>
    </div>
  )
}
