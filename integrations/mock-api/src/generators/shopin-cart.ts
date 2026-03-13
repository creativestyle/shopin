import type { CartResponse } from '@core/contracts/cart/cart'
import type { LineItemResponse } from '@core/contracts/cart/cart'
import { randomUUID } from 'crypto'

export function createShopinPrice(
  regularPriceInCents: number,
  currency: string
): CartResponse['subtotal'] {
  return {
    regularPriceInCents,
    currency,
    fractionDigits: 2,
  }
}

export function createShopinLineItem(
  productId: string,
  variantId: string | undefined,
  quantity: number,
  currency: string,
  itemPriceInCents: number = 1000
): LineItemResponse {
  return {
    id: `line-item-${randomUUID()}`,
    productId,
    productSlug: productId,
    variantId,
    quantity,
    price: createShopinPrice(itemPriceInCents, currency),
    name: `Mock Product ${productId}`,
  }
}
