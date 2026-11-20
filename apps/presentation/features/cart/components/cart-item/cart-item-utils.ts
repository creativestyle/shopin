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

const KNOWN_ATTRIBUTE_KEYS = ['color', 'size'] as const

type KnownAttributeKey = (typeof KNOWN_ATTRIBUTE_KEYS)[number]

function isKnownAttributeKey(key: string): key is KnownAttributeKey {
  return (KNOWN_ATTRIBUTE_KEYS as readonly string[]).includes(key)
}

/**
 * Translated label for an attribute key (case-insensitive), or the raw key if unknown.
 */
export function labelForAttribute(
  key: string,
  translate: (key: `item.${KnownAttributeKey}`) => string
): string {
  const normalizedKey = key.toLowerCase()
  return isKnownAttributeKey(normalizedKey)
    ? translate(`item.${normalizedKey}`)
    : key
}

/**
 * Generate product href from line item
 */
export function getProductHref(productSlug: string | undefined): string {
  return productSlug ? `/p/${productSlug}` : '#'
}
