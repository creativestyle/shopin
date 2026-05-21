'use client'

import { useState } from 'react'
import { useCart } from '@/features/cart/cart-use-cart'
import { addressesMatch } from '@/features/address/address-utils'
import type { AddressBase } from '@core/contracts/address/address-base'

function getInitialSameAsBillingState(
  billingAddress: AddressBase | undefined,
  shippingAddress: AddressBase | undefined,
  countries: readonly string[]
): boolean {
  if (!billingAddress) {
    return false
  }

  if (billingAddress.country && !countries.includes(billingAddress.country)) {
    return false
  }

  if (!shippingAddress) {
    return true
  }

  return addressesMatch(shippingAddress, billingAddress)
}

export function useSameAsBilling(countries: readonly string[]) {
  const { cart } = useCart()
  const billingAddress = cart?.billingAddress
  const shippingAddress = cart?.shippingAddress

  const [sameAsBilling, setSameAsBilling] = useState(() =>
    getInitialSameAsBillingState(billingAddress, shippingAddress, countries)
  )

  return {
    billingAddress,
    shippingAddress,
    sameAsBilling,
    setSameAsBilling,
    hasBillingAddress: !!billingAddress,
    addressesMatch: addressesMatch(shippingAddress, billingAddress),
  }
}
