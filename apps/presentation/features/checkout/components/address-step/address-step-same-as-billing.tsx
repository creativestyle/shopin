'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useCheckoutNavigation } from '../checkout-steps-frame/use-checkout-navigation'
import { useSameAsBilling } from '../../hooks/use-same-as-billing'
import { AddressStepContinueButton } from './address-step-continue-button'
import { Checkbox } from '@/components/ui/checkbox'
import { addToast } from '@/components/ui/toast'
import { useStoreConfig } from '@/features/store-config/store-config-provider'
import type {
  AddressBase,
  AddressType,
} from '@core/contracts/address/address-base'
import type { CartResponse } from '@core/contracts/cart/cart'

interface AddressStepSameAsBillingProps {
  stepId: AddressType
  addressType: AddressType
  onSetAddress: (address: AddressBase) => Promise<CartResponse | null>
  isSetAddressPending: boolean
  onCheckedChange?: (checked: boolean) => void
}

export function AddressStepSameAsBilling({
  stepId,
  addressType,
  onSetAddress,
  isSetAddressPending,
  onCheckedChange,
}: AddressStepSameAsBillingProps) {
  const { handleNextStep } = useCheckoutNavigation(stepId)
  const tCheckout = useTranslations('checkout')
  const { storeConfig } = useStoreConfig()
  const { billingAddress, sameAsBilling, setSameAsBilling } = useSameAsBilling(
    storeConfig.shippingCountries
  )

  // Notify parent when checked state changes
  useEffect(() => {
    onCheckedChange?.(sameAsBilling)
  }, [sameAsBilling, onCheckedChange])

  const isBillingCountryShippable =
    !billingAddress?.country ||
    storeConfig.shippingCountries.includes(billingAddress.country)

  // Handle "same as billing" checkbox change
  const handleSameAsBillingChange = async (checked: boolean) => {
    if (checked && !isBillingCountryShippable) {
      addToast({
        type: 'error',
        children: tCheckout('shipping.sameAsBillingCountryError'),
      })
      return
    }
    setSameAsBilling(checked)
    if (checked && billingAddress) {
      const cart = await onSetAddress(billingAddress)
      if (!cart) {
        setSameAsBilling(false)
      }
    }
  }

  // Handle continue when "same as billing" is checked
  const handleContinueWithBillingAddress = async () => {
    if (billingAddress) {
      const cart = await onSetAddress(billingAddress)
      if (!cart) {
        return
      }
      handleNextStep()
    }
  }

  return (
    <>
      <div className='mb-6 flex items-start gap-3'>
        <Checkbox
          id='same-as-billing-shipping'
          checked={sameAsBilling}
          onCheckedChange={(checked) =>
            handleSameAsBillingChange(checked === true)
          }
          className='shrink-0'
        />
        <label
          htmlFor='same-as-billing-shipping'
          className='cursor-pointer text-sm/[1.6] text-gray-700'
        >
          {tCheckout('shipping.sameAsBilling')}
        </label>
      </div>

      {sameAsBilling && (
        <AddressStepContinueButton
          stepId={stepId}
          addressType={addressType}
          isPending={isSetAddressPending}
          onClick={handleContinueWithBillingAddress}
        />
      )}
    </>
  )
}
