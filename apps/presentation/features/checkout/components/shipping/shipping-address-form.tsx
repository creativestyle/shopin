'use client'

import { AddressStepForm } from '../address-step/address-step-form'
import { useSetAddress } from '../../hooks/use-set-address'

export function ShippingAddressForm() {
  const { handleSetAddress: handleSetShippingAddress, isPending } =
    useSetAddress({
      addressType: 'shipping',
    })

  return (
    <AddressStepForm
      stepId='shipping'
      addressType='shipping'
      onSetAddress={handleSetShippingAddress}
      isSetAddressPending={isPending}
      getCartAddress={(cart) => cart?.shippingAddress}
      getDefaultFlag={(data) => ({ ...data, isDefaultShipping: true })}
    />
  )
}
