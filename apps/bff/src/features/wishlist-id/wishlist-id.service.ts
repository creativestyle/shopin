import { Injectable, Scope } from '@nestjs/common'
import {
  WISHLIST_ID_COOKIE_CONFIG,
  WISHLIST_ID_COOKIE_PREFIX_GUEST,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'
import { CookieService } from '../../common/storage/cookie.service'
import { WishlistKeyService } from './wishlist-key.service'

/**
 * Service for managing wishlist ID cookies.
 * Handles storing, retrieving, and deleting wishlist IDs from cookies.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class WishlistIdService {
  constructor(
    private readonly wishlistKeyService: WishlistKeyService,
    private readonly cookieService: CookieService
  ) {}

  /**
   * Get wishlist ID from cookie for logged-in user
   * @returns Wishlist ID or undefined if not found
   */
  async getLoggedInWishlistId(): Promise<string | undefined> {
    const key = this.wishlistKeyService.getLoggedInWishlistKey()
    return this.getWishlistId(key)
  }

  /**
   * Get wishlist ID from cookie for guest user
   * @returns Wishlist ID or undefined if not found
   */
  async getGuestWishlistId(): Promise<string | undefined> {
    const key = this.wishlistKeyService.getGuestWishlistKey()
    return this.getWishlistId(key)
  }

  /**
   * Get wishlist ID from cookie by key
   * @param key - Wishlist key (e.g., 'wishlist-guest')
   * @returns Wishlist ID or undefined if not found
   */
  private async getWishlistId(key: string): Promise<string | undefined> {
    return this.cookieService.getCookie(key, true)
  }

  /**
   * Set wishlist ID in cookie for logged-in user
   * @param wishlistId - Wishlist ID to store
   */
  async setLoggedInWishlistId(wishlistId: string): Promise<void> {
    const key = this.wishlistKeyService.getLoggedInWishlistKey()
    await this.setWishlistId(wishlistId, key)
  }

  /**
   * Set wishlist ID in cookie for guest user
   * @param wishlistId - Wishlist ID to store
   */
  async setGuestWishlistId(wishlistId: string): Promise<void> {
    const key = this.wishlistKeyService.getGuestWishlistKey()
    await this.setWishlistId(wishlistId, key)
  }

  /**
   * Set wishlist ID in cookie
   * @param wishlistId - Wishlist ID to store
   * @param key - Wishlist key (e.g., 'wishlist-guest')
   */
  private async setWishlistId(wishlistId: string, key: string): Promise<void> {
    if (
      !wishlistId ||
      typeof wishlistId !== 'string' ||
      wishlistId.trim() === ''
    ) {
      throw new Error('Wishlist ID cannot be empty')
    }

    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new Error('Wishlist key cannot be empty')
    }

    const maxAgeMs = WISHLIST_ID_COOKIE_CONFIG.MAX_AGE * 1000
    const options = this.cookieService.createCookieOptions(maxAgeMs, {
      httpOnly: WISHLIST_ID_COOKIE_CONFIG.HTTP_ONLY,
      sameSite: WISHLIST_ID_COOKIE_CONFIG.SAME_SITE,
    })
    this.cookieService.setCookie(key, wishlistId, options, true)
  }

  /**
   * Delete wishlist ID from cookie for logged-in user
   */
  async deleteLoggedInWishlistId(): Promise<void> {
    const key = this.wishlistKeyService.getLoggedInWishlistKey()
    await this.deleteWishlistId(key)
  }

  /**
   * Delete wishlist ID from cookie for guest user
   */
  async deleteGuestWishlistId(): Promise<void> {
    const key = this.wishlistKeyService.getGuestWishlistKey()
    await this.deleteWishlistId(key)
  }

  /**
   * Delete wishlist ID from cookie by key
   * @param key - Wishlist key (e.g., 'wishlist-guest')
   */
  private async deleteWishlistId(key: string): Promise<void> {
    this.cookieService.clearCookie(key)
  }

  /**
   * Delete all wishlist ID cookies (both guest and logged-in)
   * Used when user logs out
   */
  async deleteAllWishlistIds(): Promise<void> {
    const allCookieNames = this.cookieService.getAllCookieNames()
    const wishlistKeys = allCookieNames.filter(
      (key) =>
        key.startsWith(WISHLIST_ID_COOKIE_PREFIX_GUEST) ||
        key.startsWith(WISHLIST_ID_COOKIE_PREFIX_LOGGED)
    )

    for (const key of wishlistKeys) {
      this.cookieService.clearCookie(key)
    }
  }
}
