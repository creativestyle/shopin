'use client'

import { AddressStepActive } from './components/address-step/address-step-active'
import { useSetAddress } from './hooks/use-set-address'

export function ShippingActive() {
  const { handleSetAddress: handleSetShippingAddress, isPending } =
    useSetAddress({
      addressType: 'shipping',
    })

  return (
    <AddressStepActive
      stepId='shipping'
      addressType='shipping'
      onSetAddress={handleSetShippingAddress}
      isSetAddressPending={isPending}
      getCartAddress={(cart) => cart?.shippingAddress}
      getDefaultFlag={(data) => ({ ...data, isDefaultShipping: true })}
    />
  )
}
