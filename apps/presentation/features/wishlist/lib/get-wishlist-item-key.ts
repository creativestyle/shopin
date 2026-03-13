/**
 * Creates a unique key for wishlist item identification.
 * Uses variantId if available, otherwise falls back to productId.
 */
export function getWishlistItemKey(
  productId: string,
  variantId?: string
): string {
  // Prefer variantId for unique identification
  if (variantId) {
    return `${productId}-${variantId}`
  }
  // Fall back to productId only
  return productId
}
