'use client'

import { AddressStepBook } from '../address-step/address-step-book'
import { useSetAddress } from '../../hooks/use-set-address'
import { AddressResponse } from '@core/contracts/customer/address'

interface ShippingAddressBookProps {
  addresses: AddressResponse[]
  defaultShippingAddressId?: string
  defaultBillingAddressId?: string
}

export function ShippingAddressBook({
  addresses,
  defaultShippingAddressId,
  defaultBillingAddressId,
}: ShippingAddressBookProps) {
  const { handleSetAddress: handleSetShippingAddress, isPending } =
    useSetAddress({
      addressType: 'shipping',
    })

  return (
    <AddressStepBook
      stepId='shipping'
      addressType='shipping'
      addresses={addresses}
      defaultShippingAddressId={defaultShippingAddressId}
      defaultBillingAddressId={defaultBillingAddressId}
      onSetAddress={handleSetShippingAddress}
      isSetAddressPending={isPending}
    />
  )
}
