import type { LineItemResponse } from '@core/contracts/cart/cart'

/**
 * Calculate item prices (total and original if discounted).
 * Returns both the total price (discounted or regular) and the original total price
 * if the item is discounted (for discount display).
 */
export function calculateItemPrices(item: LineItemResponse): {
  totalPrice: number
  originalPrice: number | undefined
} {
  const totalPrice =
    (item.price.discountedPriceInCents ?? item.price.regularPriceInCents) *
    item.quantity

  const originalPrice = item.price.discountedPriceInCents
    ? item.price.regularPriceInCents * item.quantity
    : undefined

  return { totalPrice, originalPrice }
}

/**
 * Generate product href from line item
 */
export function getProductHref(productSlug: string | undefined): string {
  return productSlug ? `/p/${productSlug}` : '#'
}
