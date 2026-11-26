import {
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
  DATA_SOURCE_COOKIE_SUFFIX,
} from '@config/constants'
import type { DataSource } from '@config/constants'

/**
 * Generate a cart cookie key based on currency and user type.
 *
 * The key format is: `{prefix}-{currency}` where:
 * - prefix is either `cart-guest` or `cart-logged` depending on user type
 * - currency is the ISO 4217 currency code that identifies the pricing context (e.g. 'USD', 'EUR')
 *
 * Using currency (not a store or language key) ensures stores sharing a currency
 * share a guest cart, and avoids breaking existing cookies when stores are reconfigured.
 *
 * Examples:
 * - Guest cart on the US store:     `cart-guest-USD`
 * - Logged-in cart on the EU store: `cart-logged-EUR`
 * - Guest cart on mock-set:         `cart-guest-USD-mock`
 *
 * @param currency - The ISO 4217 currency code (e.g. 'USD', 'EUR')
 * @param isGuest - Whether the cart is for a guest user (default: true)
 * @param dataSource - Active data source; sources with their own cart backend get a suffix
 * @returns The cart cookie key
 */
export function getCartKey(
  currency: string,
  isGuest: boolean = true,
  dataSource?: DataSource
): string {
  const prefix = isGuest
    ? CART_ID_COOKIE_PREFIX_GUEST
    : CART_ID_COOKIE_PREFIX_LOGGED
  const suffix = dataSource && DATA_SOURCE_COOKIE_SUFFIX[dataSource]
  return suffix ? `${prefix}-${currency}-${suffix}` : `${prefix}-${currency}`
}

/** Whether a cart cookie key belongs to the data source (its suffix, or none). */
export function isCartKeyOfDataSource(
  key: string,
  dataSource?: DataSource
): boolean {
  const suffix = dataSource && DATA_SOURCE_COOKIE_SUFFIX[dataSource]
  if (suffix) {
    return key.endsWith(`-${suffix}`)
  }
  return !Object.values(DATA_SOURCE_COOKIE_SUFFIX).some((other) =>
    key.endsWith(`-${other}`)
  )
}
