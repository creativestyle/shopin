'use client'

import { FC, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { badgeVariants } from '@/components/ui/badge/badge'
import { buttonVariants } from '@/components/ui/button'
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

interface DefaultAddressButtonProps {
  isDefault: boolean
  isPending: boolean
  defaultLabel: string
  setDefaultLabel: string
  icon: ReactNode
  onSetDefault: () => void
}

// Same <button> in both states so focus survives the switch to "default"
const DefaultAddressButton: FC<DefaultAddressButtonProps> = ({
  isDefault,
  isPending,
  defaultLabel,
  setDefaultLabel,
  icon,
  onSetDefault,
}) => {
  const isInactive = isDefault || isPending

  return (
    <button
      type='button'
      aria-disabled={isInactive}
      onClick={isInactive ? undefined : onSetDefault}
      className={
        isDefault
          ? badgeVariants({ variant: 'gray' })
          : buttonVariants({
              variant: 'tertiary',
              scheme: 'black',
              size: 'auto',
              className:
                'h-auto py-1 text-xs aria-disabled:pointer-events-none aria-disabled:text-gray-400',
            })
      }
    >
      {isDefault ? (
        defaultLabel
      ) : (
        <>
          {icon}
          {setDefaultLabel}
        </>
      )}
    </button>
  )
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
      <DefaultAddressButton
        isDefault={isDefaultShipping}
        isPending={isSetDefaultShippingPending}
        defaultLabel={t('addresses.defaultShipping')}
        setDefaultLabel={t('addresses.setDefaultShipping')}
        icon={<TruckIcon className='size-4' />}
        onSetDefault={onSetDefaultShipping}
      />
      <DefaultAddressButton
        isDefault={isDefaultBilling}
        isPending={isSetDefaultBillingPending}
        defaultLabel={t('addresses.defaultBilling')}
        setDefaultLabel={t('addresses.setDefaultBilling')}
        icon={<CoinsIcon className='size-4' />}
        onSetDefault={onSetDefaultBilling}
      />
    </div>
  )
}
