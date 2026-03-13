/**
 * Cart ID cookie name constants
 */
export const CART_ID_COOKIE_PREFIX_GUEST = 'cart-guest'
export const CART_ID_COOKIE_PREFIX_LOGGED = 'cart-logged'

/**
 * Cart ID cookie max age in seconds (30 days)
 */
export const CART_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * Cart ID cookie configuration
 */
export const CART_ID_COOKIE_CONFIG = {
  /**
   * Default max age for cart ID cookies (30 days in seconds)
   */
  MAX_AGE: CART_ID_COOKIE_MAX_AGE,
  /**
   * Whether cart ID cookies should be httpOnly
   * httpOnly cookies are not accessible via JavaScript, improving security
   */
  HTTP_ONLY: true,
  /**
   * SameSite cookie attribute for cart ID cookies
   * 'strict' provides maximum CSRF protection
   */
  SAME_SITE: 'strict' as const,
} as const
