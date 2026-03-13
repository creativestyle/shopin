import {
  WISHLIST_ID_COOKIE_PREFIX_GUEST,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'

/**
 * Generate a wishlist cookie key based on user type.
 *
 * Wishlist cookies are NOT currency-specific - they persist across language/currency switches.
 */
export function getWishlistKey(isGuest: boolean = true): string {
  return isGuest
    ? WISHLIST_ID_COOKIE_PREFIX_GUEST
    : WISHLIST_ID_COOKIE_PREFIX_LOGGED
}
