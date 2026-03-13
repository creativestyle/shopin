'use client'

import { useCart } from '@/features/cart/cart-use-cart'
import { DeliveryMethodLabel } from './delivery-method-label'

export function DeliveryMethodPreview() {
  const { cart } = useCart()

  const shippingInfo = cart?.shippingInfo
  const hasShippingInfo =
    shippingInfo?.shippingMethodName && shippingInfo?.shippingMethodId

  return (
    <>
      {hasShippingInfo && shippingInfo && (
        <DeliveryMethodLabel
          name={shippingInfo.shippingMethodName}
          priceInCents={shippingInfo.price.regularPriceInCents}
          currency={shippingInfo.price.currency || cart.currency}
          fractionDigits={shippingInfo.price.fractionDigits}
          freeAboveInCents={shippingInfo.freeAbove?.regularPriceInCents}
          freeAboveCurrency={shippingInfo.freeAbove?.currency || cart.currency}
          freeAboveFractionDigits={shippingInfo.freeAbove?.fractionDigits}
          variant='preview'
        />
      )}
    </>
  )
}
