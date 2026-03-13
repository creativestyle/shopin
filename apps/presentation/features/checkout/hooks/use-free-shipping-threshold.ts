'use client'

import { useCart } from '@/features/cart/cart-use-cart'

interface UseFreeShippingThresholdProps {
  priceInCents: number
  freeAboveInCents?: number
}

export function useFreeShippingThreshold({
  priceInCents,
  freeAboveInCents,
}: UseFreeShippingThresholdProps) {
  const { cart } = useCart()
  const cartSubtotal = cart?.subtotal.regularPriceInCents ?? 0

  const meetsFreeShippingThreshold =
    freeAboveInCents !== undefined && cartSubtotal >= freeAboveInCents

  const isFree = priceInCents === 0 || meetsFreeShippingThreshold

  const hasFreeShippingThreshold =
    freeAboveInCents !== undefined && cartSubtotal < freeAboveInCents

  return {
    isFree,
    meetsFreeShippingThreshold,
    hasFreeShippingThreshold,
  }
}
