'use client'

import { AddressStepForm } from '../address-step/address-step-form'
import { useSetAddress } from '../../hooks/use-set-address'

export function BillingAddressForm() {
  const { handleSetAddress: handleSetBillingAddress, isPending } =
    useSetAddress({
      addressType: 'billing',
    })

  return (
    <AddressStepForm
      stepId='billing'
      addressType='billing'
      onSetAddress={handleSetBillingAddress}
      isSetAddressPending={isPending}
      getCartAddress={(cart) => cart?.billingAddress}
      getDefaultFlag={(data) => ({ ...data, isDefaultBilling: true })}
    />
  )
}
