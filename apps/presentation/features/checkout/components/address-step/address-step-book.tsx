'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { RadioGroup } from '@/components/ui/radio-button'
import ChevronUpIcon from '@/public/icons/chevronup.svg'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddressStepManageAddressesModal } from './address-step-manage-addresses-modal'
import { AddressStepItem } from './address-step-item'
import { AddressStepContinueButton } from './address-step-continue-button'
import { useCheckoutNavigation } from '../checkout-steps-frame/use-checkout-navigation'
import { useCart } from '@/features/cart/cart-use-cart'
import { useAddressSelection } from '@/features/address/use-address-selection'
import { AddressResponse } from '@core/contracts/customer/address'
import type {
  AddressBase,
  AddressType,
} from '@core/contracts/address/address-base'
import type { CartResponse } from '@core/contracts/cart/cart'

interface AddressStepBookProps {
  stepId: AddressType
  addressType: AddressType
  addresses: AddressResponse[]
  defaultShippingAddressId?: string
  defaultBillingAddressId?: string
  onSetAddress: (address: AddressBase) => Promise<CartResponse | null>
  isSetAddressPending: boolean
}

export function AddressStepBook({
  stepId,
  addressType,
  addresses,
  defaultShippingAddressId,
  defaultBillingAddressId,
  onSetAddress,
  isSetAddressPending,
}: AddressStepBookProps) {
  const t = useTranslations('account.myAccount')
  const { handleNextStep } = useCheckoutNavigation(stepId)
  const { cart } = useCart()
  const [sheetOpen, setSheetOpen] = useState(false)

  const {
    setUserSelectedAddressId,
    selectedAddressId,
    selectedAddress,
    visibleAddresses,
    hasMore,
    showAll,
    toggleShowAll,
  } = useAddressSelection({
    addressType,
    addresses,
    defaultShippingAddressId,
    defaultBillingAddressId,
    cart,
  })

  const handleContinue = async () => {
    if (selectedAddress) {
      const cart = await onSetAddress(selectedAddress)
      if (!cart) {
        // Error toast is already shown by the hook
        return
      }
      handleNextStep()
    }
  }

  return (
    <>
      <Card
        scheme='gray'
        className='relative mb-6 rounded-t-lg bg-gray-100 p-6'
      >
        <div className='mb-4 sm:absolute sm:top-6 sm:right-6 sm:mb-0'>
          <Button
            variant='secondary'
            onClick={() => setSheetOpen(true)}
            aria-label={t('addresses.manage')}
            className='w-full sm:w-auto'
          >
            {t('addresses.manage')}
          </Button>
        </div>

        <RadioGroup
          value={selectedAddressId || ''}
          onValueChange={setUserSelectedAddressId}
          className='space-y-4'
        >
          {visibleAddresses.map((address) => (
            <AddressStepItem
              key={address.id}
              address={address}
              addressType={addressType}
            />
          ))}
        </RadioGroup>

        {hasMore && (
          <button
            type='button'
            onClick={toggleShowAll}
            className='mt-4 flex items-center gap-2 text-sm text-gray-700 underline hover:text-gray-900'
          >
            {showAll ? (
              <>
                <ChevronUpIcon className='size-4' />
                {t('addresses.showLess')}
              </>
            ) : (
              <>
                <ChevronDownIcon className='size-4' />
                {t('addresses.showMore')}
              </>
            )}
          </button>
        )}
      </Card>

      <AddressStepContinueButton
        stepId={stepId}
        addressType={addressType}
        isPending={isSetAddressPending}
        disabled={!selectedAddressId || isSetAddressPending}
        onClick={handleContinue}
      />

      <AddressStepManageAddressesModal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAddressAdded={setUserSelectedAddressId}
      />
    </>
  )
}
