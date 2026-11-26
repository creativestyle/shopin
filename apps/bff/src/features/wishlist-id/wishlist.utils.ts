import {
  DATA_SOURCE_COOKIE_SUFFIX,
  WISHLIST_ID_COOKIE_PREFIX_GUEST,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'
import type { DataSource } from '@config/constants'

/**
 * Generate a wishlist cookie key based on user type and data source.
 *
 * Wishlist cookies are NOT currency-specific - they persist across language/currency switches.
 * Data sources with their own backend get a suffix (e.g. `wishlist-guest-mock`), like cart cookies.
 */
export function getWishlistKey(
  isGuest: boolean = true,
  dataSource?: DataSource
): string {
  const prefix = isGuest
    ? WISHLIST_ID_COOKIE_PREFIX_GUEST
    : WISHLIST_ID_COOKIE_PREFIX_LOGGED
  const suffix = dataSource && DATA_SOURCE_COOKIE_SUFFIX[dataSource]
  return suffix ? `${prefix}-${suffix}` : prefix
}
