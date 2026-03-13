import { Injectable } from '@nestjs/common'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import type { CartResponse } from '@core/contracts/cart/cart'
import type {
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveCartItemRequest,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
} from '@core/contracts/cart/cart'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
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

  async getCart(): Promise<CartResponse | null> {
    const cartId = await this.getCartId()
    if (!cartId) {
      return null
    }

    const cartService = this.getCartService()
    return await cartService.getCart(cartId)
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
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.addToCart(
      cartId,
      request.productId,
      request.variantId,
      request.quantity
    )
  }

  async updateCartItem(request: UpdateCartItemRequest): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.updateCartItem(
      cartId,
      request.lineItemId,
      request.quantity
    )
  }

  async removeCartItem(request: RemoveCartItemRequest): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.removeCartItem(cartId, request.lineItemId)
  }

  async setBillingAddress(
    request: SetBillingAddressRequest
  ): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.setBillingAddress(cartId, request)
  }

  async setShippingAddress(
    request: SetShippingAddressRequest
  ): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.setShippingAddress(cartId, request)
  }

  async getShippingMethods(): Promise<ShippingMethodsResponse> {
    const cartId = await this.getCartId()
    if (!cartId) {
      return { shippingMethods: [] }
    }
    const cartService = this.getCartService()
    return await cartService.getShippingMethods(cartId)
  }

  async setShippingMethod(
    request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    const cartId = await this.getOrCreateCartId()
    const cartService = this.getCartService()
    return await cartService.setShippingMethod(cartId, request)
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
  private async getOrCreateCartId(): Promise<string> {
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
   * Gets the current cart ID (logged-in or guest)
   * @returns Cart ID or undefined if none exists
   */
  private async getCartId(): Promise<string | undefined> {
    const isLoggedIn = await this.isLoggedIn()

    if (isLoggedIn) {
      const cartId = await this.cartIdService.getLoggedInCartId()
      if (cartId) {
        return cartId
      }
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

  /**
   * Gets the cart service from the data source factory
   */
  private getCartService() {
    return this.dataSourceFactory.getServices().cartService
  }
}
