import {
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'

/**
 * Generate a cart cookie key based on currency and user type.
 *
 * The key format is: `{prefix}-{currency}` where:
 * - prefix is either `cart-guest` or `cart-logged` depending on user type
 * - currency is the currency code (e.g., 'USD', 'EUR')
 *
 * Examples:
 * - Guest cart in USD: `cart-guest-USD`
 * - Logged-in cart in EUR: `cart-logged-EUR`
 *
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param isGuest - Whether the cart is for a guest user (default: true)
 * @returns The cart cookie key (e.g., 'cart-guest-USD' or 'cart-logged-USD')
 */
export function getCartKey(currency: string, isGuest: boolean = true): string {
  const prefix = isGuest
    ? CART_ID_COOKIE_PREFIX_GUEST
    : CART_ID_COOKIE_PREFIX_LOGGED
  return `${prefix}-${currency}`
}
