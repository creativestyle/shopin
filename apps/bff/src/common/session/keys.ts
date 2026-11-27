import {
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
  WISHLIST_ID_COOKIE_PREFIX_GUEST,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'

/** `access_token` → `access_token.mock`; `cart-guest` → `cart-guest.mock`. */
export function scopedName(base: string, provider: string): string {
  return `${base}.${provider}`
}

/**
 * Cart cookie name: `cart-guest.<provider>-USD` / `cart-logged.<provider>-EUR`, one per commerce provider and
 * currency (stores sharing a currency share a guest cart).
 */
export function getCartKey(
  currency: string,
  isGuest: boolean = true,
  provider?: string
): string {
  const prefix = isGuest
    ? CART_ID_COOKIE_PREFIX_GUEST
    : CART_ID_COOKIE_PREFIX_LOGGED
  const scoped = provider ? scopedName(prefix, provider) : prefix
  return `${scoped}-${currency}`
}

/** Wishlist cookie name, one per commerce provider: a wishlist id means nothing to another provider. */
export function getWishlistKey(
  isGuest: boolean = true,
  provider?: string
): string {
  const prefix = isGuest
    ? WISHLIST_ID_COOKIE_PREFIX_GUEST
    : WISHLIST_ID_COOKIE_PREFIX_LOGGED
  return provider ? scopedName(prefix, provider) : prefix
}
