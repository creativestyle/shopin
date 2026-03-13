'use client'

import { useTranslations } from 'next-intl'
import { AddressForm } from '@/features/address/address-form'
import { AddressBase } from '@core/contracts/address/address-base'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { useCustomerAddressOperations } from '@/features/customer/customer-use-customer-address-operations'
import {
  cleanAddressData,
  getAddressFormDefaultValues,
} from '@/features/address/address-utils'
import { useCart } from '@/features/cart/cart-use-cart'
import { useCheckoutNavigation } from '../checkout-steps-frame/use-checkout-navigation'
import { AddressStepContinueButton } from './address-step-continue-button'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { AddressType } from '@core/contracts/address/address-base'

interface AddressStepFormProps {
  stepId: AddressType
  addressType: AddressType
  onSetAddress: (address: AddressBase) => Promise<CartResponse | null>
  isSetAddressPending: boolean
  getCartAddress: (cart: CartResponse | null) => AddressBase | undefined
  getDefaultFlag: (data: AddressBase) => AddressBase
}

export function AddressStepForm({
  stepId,
  addressType,
  onSetAddress,
  isSetAddressPending,
  getCartAddress,
  getDefaultFlag,
}: AddressStepFormProps) {
  const { isLoggedIn, customer } = useCustomer()
  const { cart } = useCart()
  const { handleAddAddress, isAddAddressPending } =
    useCustomerAddressOperations()
  const { handleNextStep } = useCheckoutNavigation(stepId)
  const tCheckout = useTranslations('checkout')

  // Prefill form from cart address or customer data
  const formDefaultValues = getAddressFormDefaultValues(
    getCartAddress(cart),
    isLoggedIn ? customer : undefined
  )

  const handleFormSubmit = async (data: AddressBase) => {
    // Save address to cart (works for both guest and logged-in users)
    const cart = await onSetAddress(data)
    if (!cart) {
      // Error toast is already shown by the hook
      return
    }

    // For logged-in users for first address, also save the address to their account
    if (isLoggedIn) {
      const addressWithDefaults = getDefaultFlag(data)
      const cleanData = cleanAddressData(addressWithDefaults, false)
      await handleAddAddress(cleanData, handleNextStep)
      return
    }

    handleNextStep()
  }

  const isPending = isSetAddressPending || isAddAddressPending
  const formId = `${addressType}-address-form`

  return (
    <>
      {/* Required fields indicator */}
      <p className='mb-6 text-sm text-gray-600'>
        {tCheckout(`${addressType}.requiredFields`)}
      </p>

      {/* Address Form */}
      <AddressForm
        formId={formId}
        defaultValues={formDefaultValues}
        onSubmit={handleFormSubmit}
      />

      <AddressStepContinueButton
        stepId={stepId}
        addressType={addressType}
        isPending={isPending}
        formId={formId}
      />
    </>
  )
}
