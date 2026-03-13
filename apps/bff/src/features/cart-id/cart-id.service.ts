import { Injectable, Scope } from '@nestjs/common'
import {
  CART_ID_COOKIE_CONFIG,
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'
import { CookieService } from '../../common/storage/cookie.service'
import { CartKeyService } from './cart-key.service'

/**
 * Service for managing cart ID cookies.
 * Handles storing, retrieving, and deleting cart IDs from cookies.
 */
@Injectable({
  scope: Scope.REQUEST,
})
export class CartIdService {
  constructor(
    private readonly cartKeyService: CartKeyService,
    private readonly cookieService: CookieService
  ) {}

  /**
   * Get cart ID from cookie for logged-in user
   * @returns Cart ID or undefined if not found
   */
  async getLoggedInCartId(): Promise<string | undefined> {
    const key = this.cartKeyService.getLoggedInCartKey()
    return this.getCartId(key)
  }

  /**
   * Get cart ID from cookie for guest user
   * @returns Cart ID or undefined if not found
   */
  async getGuestCartId(): Promise<string | undefined> {
    const key = this.cartKeyService.getGuestCartKey()
    return this.getCartId(key)
  }

  /**
   * Check if logged-in cart ID exists
   * @returns true if cart ID exists, false otherwise
   */
  async hasLoggedInCartId(): Promise<boolean> {
    const cartId = await this.getLoggedInCartId()
    return !!cartId
  }

  /**
   * Check if guest cart ID exists
   * @returns true if cart ID exists, false otherwise
   */
  async hasGuestCartId(): Promise<boolean> {
    const cartId = await this.getGuestCartId()
    return !!cartId
  }

  /**
   * Get cart ID from cookie by key
   * @param key - Cart key (e.g., 'cart-guest-USD')
   * @returns Cart ID or undefined if not found
   */
  private async getCartId(key: string): Promise<string | undefined> {
    // Cart IDs should be decoded since they're encoded when set
    return this.cookieService.getCookie(key, true)
  }

  /**
   * Set cart ID in cookie for logged-in user
   * @param cartId - Cart ID to store
   */
  async setLoggedInCartId(cartId: string): Promise<void> {
    const key = this.cartKeyService.getLoggedInCartKey()
    await this.setCartId(cartId, key)
  }

  /**
   * Set cart ID in cookie for guest user
   * @param cartId - Cart ID to store
   */
  async setGuestCartId(cartId: string): Promise<void> {
    const key = this.cartKeyService.getGuestCartKey()
    await this.setCartId(cartId, key)
  }

  /**
   * Set cart ID in cookie
   * @param cartId - Cart ID to store
   * @param key - Cart key (e.g., 'cart-guest-USD')
   */
  private async setCartId(cartId: string, key: string): Promise<void> {
    // Validate cartId is not empty
    if (!cartId || typeof cartId !== 'string' || cartId.trim() === '') {
      throw new Error('Cart ID cannot be empty')
    }

    // Validate key is provided
    if (!key || typeof key !== 'string' || key.trim() === '') {
      throw new Error('Cart key cannot be empty')
    }

    // Cookie name is the key (e.g., "cart-guest-USD"), value is the cartId
    // Cart IDs should be encoded to handle special characters safely
    const maxAgeMs = CART_ID_COOKIE_CONFIG.MAX_AGE * 1000
    const options = this.cookieService.createCookieOptions(maxAgeMs, {
      httpOnly: CART_ID_COOKIE_CONFIG.HTTP_ONLY,
      sameSite: CART_ID_COOKIE_CONFIG.SAME_SITE,
    })
    this.cookieService.setCookie(key, cartId, options, true)
  }

  /**
   * Delete cart ID from cookie for logged-in user
   */
  async deleteLoggedInCartId(): Promise<void> {
    const key = this.cartKeyService.getLoggedInCartKey()
    await this.deleteCartId(key)
  }

  /**
   * Delete cart ID from cookie for guest user
   */
  async deleteGuestCartId(): Promise<void> {
    const key = this.cartKeyService.getGuestCartKey()
    await this.deleteCartId(key)
  }

  /**
   * Delete cart ID from cookie by key
   * @param key - Cart key (e.g., 'cart-guest-USD')
   */
  private async deleteCartId(key: string): Promise<void> {
    this.cookieService.clearCookie(key)
  }

  /**
   * Delete all cart ID cookies (both guest and logged-in)
   * Used when user logs out or session expires
   */
  async deleteAllCartIds(): Promise<void> {
    const allCookieNames = this.cookieService.getAllCookieNames()
    const cartKeys = allCookieNames.filter(
      (key) =>
        key.startsWith(CART_ID_COOKIE_PREFIX_GUEST) ||
        key.startsWith(CART_ID_COOKIE_PREFIX_LOGGED)
    )

    for (const key of cartKeys) {
      this.cookieService.clearCookie(key)
    }
  }
}
