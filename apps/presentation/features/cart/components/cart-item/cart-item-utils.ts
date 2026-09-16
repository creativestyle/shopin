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
 * Get the per-unit price (discounted if present, otherwise regular).
 */
export function getUnitPrice(item: LineItemResponse): number {
  return item.price.discountedPriceInCents ?? item.price.regularPriceInCents
}

/**
 * Build a human-readable variant string from line item attributes
 * (e.g. "Color: Blue · Size: M"). Known keys are translated via `labelFor`,
 * unknown keys fall back to the raw key.
 */
export function formatItemAttributes(
  attributes: LineItemResponse['attributes'],
  labelFor: (key: string) => string
): string {
  if (!attributes) {
    return ''
  }
  return Object.entries(attributes)
    .map(([key, value]) => `${labelFor(key)}: ${value}`)
    .join(' · ')
}

/**
 * Generate product href from line item
 */
export function getProductHref(productSlug: string | undefined): string {
  return productSlug ? `/p/${productSlug}` : '#'
}
