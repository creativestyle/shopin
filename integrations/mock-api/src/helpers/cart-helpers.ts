import { NotFoundException } from '@nestjs/common'
import type { CartResponse } from '@core/contracts/cart/cart'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { createShopinPrice } from '../generators/shopin-cart'

export function recalculateCartTotals(
  cart: CartResponse,
  priceDiff: number,
  quantityDiff: number
): Pick<CartResponse, 'subtotal' | 'grandTotal' | 'itemCount'> {
  return {
    subtotal: createShopinPrice(
      cart.subtotal.regularPriceInCents + priceDiff,
      cart.currency
    ),
    grandTotal: createShopinPrice(
      cart.grandTotal.regularPriceInCents + priceDiff,
      cart.currency
    ),
    itemCount: cart.itemCount + quantityDiff,
  }
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
