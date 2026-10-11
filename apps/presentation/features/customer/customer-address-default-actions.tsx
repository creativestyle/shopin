'use client'

import { FC } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCustomerAddressOperations } from './customer-use-customer-address-operations'
import TruckIcon from '@/public/icons/delivery-truck.svg'
import CoinsIcon from '@/public/icons/coins.svg'

interface CustomerAddressDefaultActionsProps {
  addressId?: string
  isDefaultShipping: boolean
  isDefaultBilling: boolean
  className?: string
}

/**
 * Default shipping/billing controls for a single address.
 * Shows a badge when the address already is the default, a button to set it otherwise.
 */
export const CustomerAddressDefaultActions: FC<
  CustomerAddressDefaultActionsProps
> = ({ addressId, isDefaultShipping, isDefaultBilling, className }) => {
  const t = useTranslations('account.myAccount')
  const {
    handleSetDefaultShipping,
    handleSetDefaultBilling,
    isSetDefaultShippingPending,
    isSetDefaultBillingPending,
  } = useCustomerAddressOperations()

  const onSetDefaultShipping = async () => {
    if (addressId) {
      await handleSetDefaultShipping(addressId)
    }
  }

  const onSetDefaultBilling = async () => {
    if (addressId) {
      await handleSetDefaultBilling(addressId)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2',
        className
      )}
    >
      {isDefaultShipping ? (
        <Badge variant='gray'>{t('addresses.defaultShipping')}</Badge>
      ) : (
        <Button
          type='button'
          variant='tertiary'
          scheme='black'
          size='auto'
          className='h-auto py-1 text-xs'
          onClick={onSetDefaultShipping}
          disabled={isSetDefaultShippingPending}
        >
          <TruckIcon className='size-4' />
          {t('addresses.setDefaultShipping')}
        </Button>
      )}
      {isDefaultBilling ? (
        <Badge variant='gray'>{t('addresses.defaultBilling')}</Badge>
      ) : (
        <Button
          type='button'
          variant='tertiary'
          scheme='black'
          size='auto'
          className='h-auto py-1 text-xs'
          onClick={onSetDefaultBilling}
          disabled={isSetDefaultBillingPending}
        >
          <CoinsIcon className='size-4' />
          {t('addresses.setDefaultBilling')}
        </Button>
      )}
    </div>
  )
}
