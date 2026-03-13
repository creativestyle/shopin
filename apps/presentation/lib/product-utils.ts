/**
 * Creates a composite key combining productId and variantId.
 * Used for unique identification across wishlist items, React keys, etc.
 */
export function getProductVariantKey(
  productId: string,
  variantId?: string
): string {
  return variantId ? `${productId}-${variantId}` : productId
}

/**
 * Generates the href for a product link.
 * Adds variantId as a query parameter when present.
 */
export function getProductHref(slug: string, variantId?: string): string {
  return variantId ? `/p/${slug}?variantId=${variantId}` : `/p/${slug}`
}
