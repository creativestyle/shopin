'use client'

import { useState } from 'react'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { useCustomerAddresses } from '@/features/customer/customer-use-customer-addresses'
import { useStoreConfig } from '@/features/store-config/store-config-provider'
import { AddressStepBook } from './address-step-book'
import { AddressStepForm } from './address-step-form'
import { AddressStepSameAsBilling } from './address-step-same-as-billing'
import type {
  AddressBase,
  AddressType,
} from '@core/contracts/address/address-base'
import type { CartResponse } from '@core/contracts/cart/cart'

interface AddressStepActiveProps {
  stepId: AddressType
  addressType: AddressType
  onSetAddress: (address: AddressBase) => Promise<CartResponse | null>
  isSetAddressPending: boolean
  getCartAddress: (cart: CartResponse | null) => AddressBase | undefined
  getDefaultFlag: (data: AddressBase) => AddressBase
}

export function AddressStepActive({
  stepId,
  addressType,
  onSetAddress,
  isSetAddressPending,
  getCartAddress,
  getDefaultFlag,
}: AddressStepActiveProps) {
  const { isLoggedIn } = useCustomer()
  const [isSameAsBillingChecked, setIsSameAsBillingChecked] = useState(false)
  const {
    addresses: allAddresses,
    defaultBillingAddressId,
    isLoading: isAddressesLoading,
    defaultShippingAddressId,
  } = useCustomerAddresses(isLoggedIn)
  const { storeConfig } = useStoreConfig()
  const addresses =
    addressType === 'shipping'
      ? allAddresses.filter(
          (addr) =>
            !addr.country ||
            storeConfig.shippingCountries.includes(addr.country)
        )
      : allAddresses

  // For shipping address
  const isShippingAddress = addressType === 'shipping'

  // Show address book if user is logged in and has addresses
  const showAddressBook =
    isLoggedIn && !isAddressesLoading && addresses.length > 0

  return (
    <>
      {/* Same as Billing Component - Only for shipping address */}
      {isShippingAddress && (
        <AddressStepSameAsBilling
          stepId={stepId}
          addressType={addressType}
          onSetAddress={onSetAddress}
          isSetAddressPending={isSetAddressPending}
          onCheckedChange={setIsSameAsBillingChecked}
        />
      )}

      {/* Show address book if "same as billing" is not checked or not applicable */}
      {(!isShippingAddress || !isSameAsBillingChecked) && showAddressBook && (
        <AddressStepBook
          stepId={stepId}
          addressType={addressType}
          addresses={addresses}
          defaultShippingAddressId={defaultShippingAddressId}
          defaultBillingAddressId={defaultBillingAddressId}
          onSetAddress={onSetAddress}
          isSetAddressPending={isSetAddressPending}
        />
      )}

      {/* Show form if "same as billing" is not checked or not applicable */}
      {(!isShippingAddress || !isSameAsBillingChecked) && !showAddressBook && (
        <AddressStepForm
          stepId={stepId}
          addressType={addressType}
          onSetAddress={onSetAddress}
          isSetAddressPending={isSetAddressPending}
          getCartAddress={getCartAddress}
          getDefaultFlag={getDefaultFlag}
        />
      )}
    </>
  )
}
