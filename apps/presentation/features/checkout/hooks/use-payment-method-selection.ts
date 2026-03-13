'use client'

import { useState } from 'react'
import type { PaymentMethodResponse } from '@core/contracts/cart/payment-method'

interface UsePaymentMethodSelectionProps {
  paymentMethods: PaymentMethodResponse[]
  cartPaymentMethodId?: string
}

function getInitialSelectedMethod(
  paymentMethods: PaymentMethodResponse[],
  cartPaymentMethodId?: string
): string {
  if (paymentMethods.length === 0) {
    return ''
  }

  if (cartPaymentMethodId) {
    const cartMethod = paymentMethods.find((m) => m.id === cartPaymentMethodId)
    if (cartMethod) {
      return cartMethod.id
    }
  }

  const defaultMethod =
    paymentMethods.find((m) => m.isDefault) || paymentMethods[0]
  return defaultMethod?.id || ''
}

export function usePaymentMethodSelection({
  paymentMethods,
  cartPaymentMethodId,
}: UsePaymentMethodSelectionProps) {
  const initialSelectedMethod = getInitialSelectedMethod(
    paymentMethods,
    cartPaymentMethodId
  )

  const [userSelectedMethod, setUserSelectedMethod] = useState<string | null>(
    null
  )
  const [prevCartPaymentMethodId, setPrevCartPaymentMethodId] =
    useState(cartPaymentMethodId)
  const [prevPaymentMethods, setPrevPaymentMethods] = useState(paymentMethods)

  if (cartPaymentMethodId !== prevCartPaymentMethodId) {
    setPrevCartPaymentMethodId(cartPaymentMethodId)
    if (userSelectedMethod !== null) {
      setUserSelectedMethod(null)
    }
  }

  if (paymentMethods !== prevPaymentMethods) {
    setPrevPaymentMethods(paymentMethods)
    if (
      userSelectedMethod &&
      !paymentMethods.some((m) => m.id === userSelectedMethod)
    ) {
      setUserSelectedMethod(null)
    }
  }

  const selectedMethod =
    userSelectedMethod &&
    paymentMethods.some((m) => m.id === userSelectedMethod)
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
