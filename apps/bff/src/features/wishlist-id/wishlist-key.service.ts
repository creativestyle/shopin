import { Injectable, Scope } from '@nestjs/common'
import { getWishlistKey } from './wishlist.utils'

/**
 * Service for generating wishlist keys based on user type.
 * Handles key generation logic.
 *
 * Note: Unlike cart cookies, wishlist cookies are NOT currency-specific.
 * Wishlists persist across language/currency switches, with prices displayed
 * in the current currency/language at render time.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class WishlistKeyService {
  /**
   * Gets wishlist key for logged-in user
   * @returns Wishlist key for logged-in user
   */
  getLoggedInWishlistKey(): string {
    return getWishlistKey(false)
  }

  /**
   * Gets wishlist key for guest user
   * @returns Wishlist key for guest user
   */
  getGuestWishlistKey(): string {
    return getWishlistKey(true)
  }
}
