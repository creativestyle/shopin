import { NotFoundException } from '@nestjs/common'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { createShopinPrice } from '../generators/shopin-cart'

export function recalculateCartTotals(
  cart: CartResponse,
  priceDiff: number,
  quantityDiff: number
): Pick<CartResponse, 'subtotal' | 'grandTotal' | 'itemCount'> {
  const subtotalInCents = cart.subtotal.regularPriceInCents + priceDiff

  return {
    subtotal: createShopinPrice(subtotalInCents, cart.currency),
    // Derived from subtotal so an applied discount survives line item changes.
    grandTotal: createShopinPrice(
      applyDiscount(subtotalInCents, cart.discountAmount?.regularPriceInCents),
      cart.currency
    ),
    itemCount: cart.itemCount + quantityDiff,
  }
}

/** Discount never pushes the total below zero. */
export function applyDiscount(
  subtotalInCents: number,
  discountInCents = 0
): number {
  return Math.max(0, subtotalInCents - discountInCents)
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
