'use client'

import { useState } from 'react'
import type { ShippingMethodResponse } from '@core/contracts/cart/shipping-method'

interface UseDeliveryMethodSelectionProps {
  shippingMethods: ShippingMethodResponse[]
  cartShippingMethodId?: string
}

function getInitialSelectedMethod(
  shippingMethods: ShippingMethodResponse[],
  cartShippingMethodId?: string
): string {
  if (shippingMethods.length === 0) {
    return ''
  }

  if (cartShippingMethodId) {
    const cartMethod = shippingMethods.find(
      (m) => m.id === cartShippingMethodId
    )
    if (cartMethod) {
      return cartMethod.id
    }
  }

  const defaultMethod =
    shippingMethods.find((m) => m.isDefault) || shippingMethods[0]
  return defaultMethod?.id || ''
}

export function useDeliveryMethodSelection({
  shippingMethods,
  cartShippingMethodId,
}: UseDeliveryMethodSelectionProps) {
  const initialSelectedMethod = getInitialSelectedMethod(
    shippingMethods,
    cartShippingMethodId
  )

  const [userSelectedMethod, setUserSelectedMethod] = useState<string | null>(
    null
  )
  const [prevCartShippingMethodId, setPrevCartShippingMethodId] =
    useState(cartShippingMethodId)
  const [prevShippingMethods, setPrevShippingMethods] =
    useState(shippingMethods)

  if (cartShippingMethodId !== prevCartShippingMethodId) {
    setPrevCartShippingMethodId(cartShippingMethodId)
    if (userSelectedMethod !== null) {
      setUserSelectedMethod(null)
    }
  }

  if (shippingMethods !== prevShippingMethods) {
    setPrevShippingMethods(shippingMethods)
    if (
      userSelectedMethod &&
      !shippingMethods.some((m) => m.id === userSelectedMethod)
    ) {
      setUserSelectedMethod(null)
    }
  }

  const selectedMethod =
    userSelectedMethod &&
    shippingMethods.some((m) => m.id === userSelectedMethod)
      ? userSelectedMethod
      : initialSelectedMethod

  const setSelectedMethod = (method: string) => {
    setUserSelectedMethod(method)
  }

  return {
    selectedMethod,
    setSelectedMethod,
  }
}
