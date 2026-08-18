'use client'

import { useCart } from '@/features/cart/cart-use-cart'
import { useShippingMethods } from '../../hooks/use-shipping-methods'
import { DeliveryMethodLabel } from './delivery-method-label'

export function DeliveryMethodPreview() {
  const { cart } = useCart()

  const shippingInfo = cart?.shippingInfo
  const hasShippingInfo =
    shippingInfo?.shippingMethodName && shippingInfo?.shippingMethodId

  const { data: shippingMethodsData } = useShippingMethods(!!hasShippingInfo)
  const selectedMethod = shippingMethodsData?.shippingMethods.find(
    (method) => method.id === shippingInfo?.shippingMethodId
  )

  return (
    <>
      {hasShippingInfo && shippingInfo && (
        <DeliveryMethodLabel
          name={
            selectedMethod?.description ||
            selectedMethod?.name ||
            shippingInfo.shippingMethodName
          }
          priceInCents={shippingInfo.price.regularPriceInCents}
          currency={shippingInfo.price.currency || cart.currency}
          fractionDigits={shippingInfo.price.fractionDigits}
          freeAboveInCents={
            shippingInfo.freeAbove?.regularPriceInCents ??
            selectedMethod?.freeAbove?.centAmount
          }
          freeAboveCurrency={
            shippingInfo.freeAbove?.currency ||
            selectedMethod?.freeAbove?.currencyCode ||
            cart.currency
          }
          freeAboveFractionDigits={shippingInfo.freeAbove?.fractionDigits}
          variant='preview'
        />
      )}
    </>
  )
}
