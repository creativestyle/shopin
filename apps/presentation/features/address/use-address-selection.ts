'use client'

import { useState } from 'react'
import { sortAddresses, findMatchingAddressId } from './address-utils'
import { AddressResponse } from '@core/contracts/customer/address'
import type { CartResponse } from '@core/contracts/cart/cart'
import type {
  AddressBase,
  AddressType,
} from '@core/contracts/address/address-base'

const INITIAL_VISIBLE_COUNT = 3

interface UseAddressSelectionProps {
  addressType: AddressType
  addresses: AddressResponse[]
  defaultShippingAddressId?: string
  defaultBillingAddressId?: string
  cart?: CartResponse | null
}

export function useAddressSelection({
  addressType,
  addresses,
  defaultShippingAddressId,
  defaultBillingAddressId,
  cart,
}: UseAddressSelectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [userSelectedAddressId, setUserSelectedAddressId] = useState<
    string | undefined
  >()

  // Get the cart address based on address type
  const cartAddress: AddressBase | undefined =
    addressType === 'billing' ? cart?.billingAddress : cart?.shippingAddress

  // Find matching address from cart address
  const cartMatchingAddressId = findMatchingAddressId(cartAddress, addresses)

  // Get the default address ID based on address type
  const defaultAddressId =
    addressType === 'billing'
      ? defaultBillingAddressId
      : defaultShippingAddressId

  // Compute effective selected address ID: user selection, cart match, or default address
  const selectedAddressId =
    userSelectedAddressId ||
    cartMatchingAddressId ||
    (defaultAddressId && addresses.length > 0
      ? addresses.find((addr) => addr.id === defaultAddressId)?.id
      : undefined)

  // Derive selected address from selectedAddressId
  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId
  )

  // Sort addresses
  const sortedAddresses = sortAddresses(
    addresses,
    defaultShippingAddressId,
    defaultBillingAddressId
  )

  // Check if selected address is beyond initial visible count
  const selectedIndex =
    selectedAddressId && sortedAddresses.length > INITIAL_VISIBLE_COUNT
      ? sortedAddresses.findIndex((addr) => addr.id === selectedAddressId)
      : -1
  const shouldAutoExpand = selectedIndex >= INITIAL_VISIBLE_COUNT

  // Compute effective showAll: user toggle OR auto-expand if selected address requires it
  const effectiveShowAll = showAll || shouldAutoExpand

  // Compute visible addresses based on effectiveShowAll state
  const visibleAddresses = effectiveShowAll
    ? sortedAddresses
    : sortedAddresses.slice(0, INITIAL_VISIBLE_COUNT)

  const hasMore = sortedAddresses.length > INITIAL_VISIBLE_COUNT

  const toggleShowAll = () => {
    setShowAll((prev) => !prev)
  }

  return {
    userSelectedAddressId,
    setUserSelectedAddressId,
    selectedAddressId,
    selectedAddress,
    visibleAddresses,
    hasMore,
    showAll: effectiveShowAll,
    toggleShowAll,
  }
}
