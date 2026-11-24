import { NotFoundException } from '@nestjs/common'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { createShopinPrice } from '../generators/shopin-cart'

export function recalculateCartTotals(
  cart: CartResponse,
  priceDiff: number,
  quantityDiff: number
): Pick<CartResponse, 'subtotal' | 'grandTotal' | 'itemCount'> {
  const subtotal = createShopinPrice(
    cart.subtotal.regularPriceInCents + priceDiff,
    cart.currency
  )

  return {
    subtotal,
    grandTotal: computeGrandTotal({ ...cart, subtotal }),
    itemCount: cart.itemCount + quantityDiff,
  }
}

/** Subtotal minus discount (never below zero), plus shipping. */
export function computeGrandTotal(
  cart: Pick<
    CartResponse,
    'subtotal' | 'discountAmount' | 'shippingInfo' | 'currency'
  >
): CartResponse['grandTotal'] {
  const discountedSubtotal = Math.max(
    0,
    cart.subtotal.regularPriceInCents -
      (cart.discountAmount?.regularPriceInCents ?? 0)
  )
  const shipping = cart.shippingInfo?.price.regularPriceInCents ?? 0
  return createShopinPrice(discountedSubtotal + shipping, cart.currency)
}

export function findLineItem(
  cart: CartResponse,
  lineItemId: string
): { lineItem: LineItemResponse; index: number } {
  const index = cart.lineItems.findIndex((item) => item.id === lineItemId)
  if (index === -1) {
    throw new NotFoundException(`Line item not found: ${lineItemId}`)
  }
  return { lineItem: cart.lineItems[index], index }
}
