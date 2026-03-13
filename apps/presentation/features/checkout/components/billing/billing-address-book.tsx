'use client'

import { AddressStepBook } from '../address-step/address-step-book'
import { useSetAddress } from '../../hooks/use-set-address'
import { AddressResponse } from '@core/contracts/customer/address'

interface BillingAddressBookProps {
  addresses: AddressResponse[]
  defaultShippingAddressId?: string
  defaultBillingAddressId?: string
}

export function BillingAddressBook({
  addresses,
  defaultShippingAddressId,
  defaultBillingAddressId,
}: BillingAddressBookProps) {
  const { handleSetAddress: handleSetBillingAddress, isPending } =
    useSetAddress({
      addressType: 'billing',
    })

  return (
    <AddressStepBook
      stepId='billing'
      addressType='billing'
      addresses={addresses}
      defaultShippingAddressId={defaultShippingAddressId}
      defaultBillingAddressId={defaultBillingAddressId}
      onSetAddress={handleSetBillingAddress}
      isSetAddressPending={isPending}
    />
  )
}
