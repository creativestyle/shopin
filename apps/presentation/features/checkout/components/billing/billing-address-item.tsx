'use client'

import { AddressStepItem } from '../address-step/address-step-item'
import { AddressResponse } from '@core/contracts/customer/address'

interface BillingAddressItemProps {
  address: AddressResponse
}

export function BillingAddressItem({ address }: BillingAddressItemProps) {
  return (
    <AddressStepItem
      address={address}
      addressType='billing'
    />
  )
}
