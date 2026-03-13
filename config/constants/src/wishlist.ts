/**
 * Wishlist ID cookie name constants
 */
export const WISHLIST_ID_COOKIE_PREFIX_GUEST = 'wishlist-guest'
export const WISHLIST_ID_COOKIE_PREFIX_LOGGED = 'wishlist-logged'

/**
 * Wishlist ID cookie max age in seconds (90 days)
 * Wishlists typically have a longer lifetime than carts
 */
export const WISHLIST_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 90

/**
 * Wishlist ID cookie configuration
 */
export const WISHLIST_ID_COOKIE_CONFIG = {
  /**
   * Default max age for wishlist ID cookies (90 days in seconds)
   */
  MAX_AGE: WISHLIST_ID_COOKIE_MAX_AGE,
  /**
   * Whether wishlist ID cookies should be httpOnly
   * httpOnly cookies are not accessible via JavaScript, improving security
   */
  HTTP_ONLY: true,
  /**
   * SameSite cookie attribute for wishlist ID cookies
   * 'strict' provides maximum CSRF protection
   */
  SAME_SITE: 'strict' as const,
} as const
