'use client'

import { AddressStepItem } from '../address-step/address-step-item'
import { AddressResponse } from '@core/contracts/customer/address'

interface ShippingAddressItemProps {
  address: AddressResponse
}

export function ShippingAddressItem({ address }: ShippingAddressItemProps) {
  return (
    <AddressStepItem
      address={address}
      addressType='shipping'
    />
  )
}
