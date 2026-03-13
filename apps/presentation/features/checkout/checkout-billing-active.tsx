'use client'

import { AddressStepActive } from './components/address-step/address-step-active'
import { useSetAddress } from './hooks/use-set-address'

export function BillingActive() {
  const { handleSetAddress: handleSetBillingAddress, isPending } =
    useSetAddress({
      addressType: 'billing',
    })

  return (
    <AddressStepActive
      stepId='billing'
      addressType='billing'
      onSetAddress={handleSetBillingAddress}
      isSetAddressPending={isPending}
      getCartAddress={(cart) => cart?.billingAddress}
      getDefaultFlag={(data) => ({ ...data, isDefaultBilling: true })}
    />
  )
}
