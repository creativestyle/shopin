import {
  ConflictException,
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common'
import { Services, Ports } from '../../data-source/ports.module'
import { currentProviders, isOwnSignIn } from '../../data-source/providers'
import type { CartResponse } from '@core/contracts/cart/cart'
import {
  CartVersionConflictError,
  DiscountCodeError,
} from '@core/contracts/cart/cart'
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
    services: Services,
    ports: Ports,
    private readonly cartIdService: CartIdService,
    tokenProvider: TokenProvider,
    tokenStorageService: TokenStorageService
  ) {
    super(tokenProvider, tokenStorageService, services, ports)
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
    try {
      return await this.checkAndAddDiscountCode(cartId, request.code)
    } catch (error) {
      if (!(error instanceof CartVersionConflictError)) {
        throw error
      }
    }
    // The cart changed since the check; re-run it once against the new state.
    try {
      return await this.checkAndAddDiscountCode(cartId, request.code)
    } catch (error) {
      if (error instanceof CartVersionConflictError) {
        throw new ConflictException()
      }
      throw error
    }
  }

  private async checkAndAddDiscountCode(
    cartId: string,
    code: string
  ): Promise<CartResponse> {
    const cartService = this.getCartService()

    const cart = await cartService.getCart(cartId)
    if (cart.discountCodes?.some((entry) => entry.applied)) {
      throw new FrontendSafeException('alreadyApplied')
    }

    // Stale codes are replaced, not kept: CT would reapply them once the cart matches again.
    const staleCodeIds = (cart.discountCodes ?? []).map((entry) => entry.id)

    try {
      // The checked version makes check and write atomic: a parallel apply gets a conflict.
      return await cartService.addDiscountCode(cartId, code, {
        replaceDiscountCodeIds: staleCodeIds,
        expectedVersion: cart.version,
      })
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
   * Sets the shop's own cart fields (validated by the controller against `contracts.cart`) on the shopper's cart,
   * the one of the sealed cart cookie: a request never names the cart. 501 when this request's commerce platform
   * has no `setCartFields`, 404 when the shopper has no cart.
   */
  async setFields(fields: Record<string, unknown>): Promise<CartResponse> {
    const commerce = this.ports.commerce
    if (!commerce.setCartFields) {
      throw new NotImplementedException(
        `cart fields: commerce provider "${currentProviders().providers.commerce}" does not store them (it has no setCartFields)`
      )
    }
    const cartId = await this.getCartId()
    if (!cartId) {
      throw new NotFoundException('no cart')
    }
    return commerce.setCartFields(cartId, fields)
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
   * Sets up the cart after sign-in. Runs before the guest's commerce token is dropped, so a take-over can still prove
   * the guest cart is this shopper's.
   * - Sign-in through another identity provider, on a platform with `attachGuestCart`: the guest cart is taken over
   *   first. With items, it becomes the customer's cart (the shopper's latest intent; an older active cart stays in
   *   the account). An empty one leaves the customer's active cart in charge.
   * - The platform's own sign-in merges the guest cart itself (commercetools `me/login`): its active cart wins.
   * - A platform that cannot list a customer's carts keeps the guest cart id for the customer.
   * The guest cart cookie goes only once the cart is settled, or when the platform refuses the cart as another
   * shopper's (403, 404). Any other error is rethrown with the cookie kept (sign-in still succeeds).
   * @param guestCartId - the guest cart id read before sign-in
   */
  async setupCartAfterLogin(guestCartId?: string): Promise<void> {
    const commerce = this.ports.commerce
    if (guestCartId && commerce.attachGuestCart && !isOwnSignIn()) {
      let attached: CartResponse | undefined
      try {
        attached = await commerce.attachGuestCart(guestCartId)
      } catch (error) {
        const status = (error as { getStatus?: () => number }).getStatus?.()
        if (status !== 403 && status !== 404) {
          throw error
        }
      }
      await this.cartIdService.deleteGuestCartId()
      if (attached?.lineItems?.length) {
        await this.cartIdService.setLoggedInCartId(attached.id)
        return
      }
      const active = await this.getCartService().getActiveCart()
      const cartId = active?.id ?? attached?.id
      if (cartId) {
        await this.cartIdService.setLoggedInCartId(cartId)
      }
      return
    }

    if (guestCartId) {
      await this.cartIdService.deleteGuestCartId()
    }

    const cartService = this.getCartService()
    const activeCart = await cartService.getActiveCart()

    if (activeCart) {
      await this.cartIdService.setLoggedInCartId(activeCart.id)
      return
    }
    if (!guestCartId) {
      return
    }
    if (!commerce.attachGuestCart) {
      // the platform finds the customer's cart itself, or keeps the guest cart for the customer on first use
      await this.cartIdService.setLoggedInCartId(guestCartId)
      return
    }
    try {
      const attached = await commerce.attachGuestCart(guestCartId)
      await this.cartIdService.setLoggedInCartId(attached.id)
    } catch (error) {
      const status = (error as { getStatus?: () => number }).getStatus?.()
      if (status !== 403 && status !== 404) {
        throw error
      }
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
    return this.services.cartService
  }
}
