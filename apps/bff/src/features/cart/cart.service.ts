import { Injectable, NotFoundException } from '@nestjs/common'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import type { CartResponse } from '@core/contracts/cart/cart'
import { DiscountCodeError } from '@core/contracts/cart/cart'
import type {
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveCartItemRequest,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
  ApplyDiscountCodeRequest,
  RemoveDiscountCodeRequest,
} from '@core/contracts/cart/cart'
import { FrontendSafeException } from '../../common/errors/frontend-safe.exception'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import type { GetCartOptions } from '@core/contracts/core/data-source-interfaces'
import { CartIdService } from '../cart-id/cart-id.service'
import { TokenProvider } from '../../common/token-management/token-provider'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { BaseAuthenticatedService } from '../auth/base-authenticated.service'

@Injectable()
export class CartService extends BaseAuthenticatedService {
  constructor(
    dataSourceFactory: DataSourceFactory,
    private readonly cartIdService: CartIdService,
    tokenProvider: TokenProvider,
    tokenStorageService: TokenStorageService
  ) {
    super(tokenProvider, tokenStorageService, dataSourceFactory)
  }

  async getCart(options?: GetCartOptions): Promise<CartResponse | null> {
    const cartId = await this.getCartId()
    if (!cartId) {
      return null
    }

    const cartService = this.getCartService()
    try {
      return await cartService.getCart(cartId, options)
    } catch (error) {
      // Stale id (e.g. mock cart lost on BFF restart): drop it so a new cart is created
      if (error instanceof NotFoundException) {
        await this.clearCartId()
        return null
      }
      throw error
    }
  }

  async getOrCreateCart(): Promise<CartResponse> {
    const cart = await this.getCart()
    if (cart) {
      return cart
    }
    return await this.createCart()
  }

  async createCart(): Promise<CartResponse> {
    await this.ensureSession()

    const cartService = this.getCartService()
    const cart = await cartService.createCart()

    await this.setCartId(cart.id)

    return cart
  }

  async addToCart(request: AddToCartRequest): Promise<CartResponse> {
    return this.withCartId((cartId) =>
      this.getCartService().addToCart(
        cartId,
        request.productId,
        request.variantId,
        request.quantity
      )
    )
  }

  async updateCartItem(request: UpdateCartItemRequest): Promise<CartResponse> {
    return this.withCartId(
      (cartId) =>
        this.getCartService().updateCartItem(
          cartId,
          request.lineItemId,
          request.quantity
        ),
      { retry: false }
    )
  }

  async removeCartItem(request: RemoveCartItemRequest): Promise<CartResponse> {
    return this.withCartId(
      (cartId) =>
        this.getCartService().removeCartItem(cartId, request.lineItemId),
      { retry: false }
    )
  }

  async setBillingAddress(
    request: SetBillingAddressRequest
  ): Promise<CartResponse> {
    return this.withCartId((cartId) =>
      this.getCartService().setBillingAddress(cartId, request)
    )
  }

  async setShippingAddress(
    request: SetShippingAddressRequest
  ): Promise<CartResponse> {
    return this.withCartId((cartId) =>
      this.getCartService().setShippingAddress(cartId, request)
    )
  }

  async getShippingMethods(): Promise<ShippingMethodsResponse> {
    const cartId = await this.getCartId()
    if (!cartId) {
      return { shippingMethods: [] }
    }
    try {
      return await this.getCartService().getShippingMethods(cartId)
    } catch (error) {
      if (await this.isStaleCartError(error, cartId)) {
        await this.clearCartId()
        return { shippingMethods: [] }
      }
      throw error
    }
  }

  async setShippingMethod(
    request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    return this.withCartId((cartId) =>
      this.getCartService().setShippingMethod(cartId, request)
    )
  }

  /** Single-code rule is enforced here too, since this endpoint is callable directly. */
  async applyDiscountCode(
    request: ApplyDiscountCodeRequest
  ): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()

    const cart = await cartService.getCart(cartId)
    if (cart.discountCodes?.some((entry) => entry.applied)) {
      throw new FrontendSafeException('alreadyApplied')
    }

    // Stale codes are replaced, not kept: CT would reapply them once the cart matches again.
    const staleCodeIds = (cart.discountCodes ?? []).map((entry) => entry.id)

    try {
      return await cartService.addDiscountCode(
        cartId,
        request.code,
        staleCodeIds
      )
    } catch (error) {
      if (error instanceof DiscountCodeError) {
        throw new FrontendSafeException(error.reason)
      }
      throw error
    }
  }

  async removeDiscountCode(
    request: RemoveDiscountCodeRequest
  ): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.removeDiscountCode(cartId, request.discountCodeId)
  }

  /**
   * Clear cart ID cookie (used when order already exists)
   */
  async clearCartId(): Promise<void> {
    const isLoggedIn = await this.isLoggedIn()
    if (isLoggedIn) {
      await this.cartIdService.deleteLoggedInCartId()
    } else {
      await this.cartIdService.deleteGuestCartId()
    }
  }

  /**
   * Setup cart after user login.
   * Gets the active cart for the logged-in user if it exists,
   * deletes the guest cart cookie if it existed, and sets the logged-in cart ID.
   * @param guestCartId - Optional guest cart ID to delete after login
   */
  async setupCartAfterLogin(guestCartId?: string): Promise<void> {
    if (guestCartId) {
      await this.cartIdService.deleteGuestCartId()
    }

    const cartService = this.getCartService()
    const activeCart = await cartService.getActiveCart()

    if (activeCart) {
      await this.cartIdService.setLoggedInCartId(activeCart.id)
    }
  }

  /**
   * Get cart ID from cart ID service, or create a new cart if none exists.
   * This method does not fetch the full cart, only gets/creates the cart ID.
   */
  async getOrCreateCartId(): Promise<string> {
    const cartId = await this.getCartId()
    if (cartId) {
      return cartId
    }

    await this.ensureSession()

    const cartService = this.getCartService()
    const cart = await cartService.createCart()

    await this.setCartId(cart.id)

    return cart.id
  }

  /**
   * Gets the current cart ID (logged-in or guest).
   * For logged-in users with no cached cart ID, falls back to discovering the active cart
   * from CT — this handles the case where the user logged in from a different currency/language.
   * @returns Cart ID or undefined if none exists
   */
  private async getCartId(): Promise<string | undefined> {
    const isLoggedIn = await this.isLoggedIn()

    if (isLoggedIn) {
      const cartId = await this.cartIdService.getLoggedInCartId()
      if (cartId) {
        return cartId
      }

      const cartService = this.getCartService()
      const activeCart = await cartService.getActiveCart()
      if (activeCart) {
        await this.cartIdService.setLoggedInCartId(activeCart.id)
        return activeCart.id
      }

      return undefined
    }

    return await this.cartIdService.getGuestCartId()
  }

  /**
   * Sets the cart ID in the appropriate cookie based on login status
   */
  private async setCartId(cartId: string): Promise<void> {
    const isLoggedIn = await this.isLoggedIn()
    if (isLoggedIn) {
      await this.cartIdService.setLoggedInCartId(cartId)
    } else {
      await this.cartIdService.setGuestCartId(cartId)
    }
  }

  /** On a stale cart id: new cart, then retry once (or return it empty when `retry: false`) */
  private async withCartId(
    operation: (cartId: string) => Promise<CartResponse>,
    { retry = true }: { retry?: boolean } = {}
  ): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    try {
      return await operation(cartId)
    } catch (error) {
      if (!(await this.isStaleCartError(error, cartId))) {
        throw error
      }
      await this.clearCartId()
      const cart = await this.createCart()
      return retry ? await operation(cart.id) : cart
    }
  }

  private async isStaleCartError(
    error: unknown,
    cartId: string
  ): Promise<boolean> {
    if (!(error instanceof NotFoundException)) {
      return false
    }
    try {
      await this.getCartService().getCart(cartId, { withInventory: false })
      return false
    } catch (lookupError) {
      if (lookupError instanceof NotFoundException) {
        return true
      }
      throw lookupError
    }
  }

  /**
   * Gets the cart service from the data source factory
   */
  private getCartService() {
    return this.dataSourceFactory.getServices().cartService
  }
}
