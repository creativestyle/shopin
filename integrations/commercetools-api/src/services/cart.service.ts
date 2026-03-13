import { Injectable, Inject, Scope } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import {
  resolveCurrencyFromLanguage,
  resolveCountryFromLanguage,
} from '@core/i18n/currency-utils'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type {
  CartResponse,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
} from '@core/contracts/cart/cart'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import { UserClientService } from '../client/user-client.service'
import { mapCartToResponse } from '../mappers/cart'
import { mapShippingMethodsToResponse } from '../mappers/shipping-method'
import { CartApiResponseSchema } from '../schemas/cart'
import {
  CartUpdateActionSchema,
  type CartUpdateAction,
} from '../schemas/cart-update-action'

@Injectable({ scope: Scope.REQUEST })
export class CartService {
  private static readonly CART_EXPAND = [
    'lineItems[*].product',
    'lineItems[*].variant',
    'lineItems[*].product.productType',
    'paymentInfo.payments[*]',
  ] satisfies string[]

  constructor(
    private readonly userClientService: UserClientService,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  private async getCurrentLanguage(): Promise<string> {
    return this.languageProvider.getCurrentLanguage()
  }

  private async getClient() {
    return this.userClientService.getClient()
  }

  private async updateCartWithAction(
    cartId: string,
    actionData: unknown
  ): Promise<CartResponse> {
    return this.updateCartWithActions(cartId, [actionData])
  }

  private async processCartResponse(
    responseBody: unknown,
    currentLanguage: string
  ): Promise<CartResponse> {
    const validatedCart = CartApiResponseSchema.parse(responseBody)
    const mappedCart = mapCartToResponse(validatedCart, currentLanguage)
    return CartResponseSchema.parse(mappedCart)
  }

  async updateCartWithActions(
    cartId: string,
    actionsData: unknown[]
  ): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    // Get cart version from cartId
    const cartForVersion = await this.getCart(cartId, [])
    const cartVersion = cartForVersion.version

    const validatedActions = actionsData.map((actionData) =>
      CartUpdateActionSchema.parse(actionData)
    )

    const response = await client
      .me()
      .carts()
      .withId({ ID: cartId })
      .post({
        body: {
          version: cartVersion,
          actions: validatedActions,
        },
        queryArgs: {
          expand: CartService.CART_EXPAND,
        },
      })
      .execute()

    return this.processCartResponse(response.body, currentLanguage)
  }

  async getCart(cartId: string, expand?: string[]): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()
    const expandArray = expand ?? CartService.CART_EXPAND
    const response = await client
      .me()
      .carts()
      .withId({ ID: cartId })
      .get({
        queryArgs: {
          expand: expandArray,
        },
      })
      .execute()

    return this.processCartResponse(response.body, currentLanguage)
  }

  async createCart(): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)
    const client = await this.getClient()

    const response = await client
      .me()
      .carts()
      .post({
        body: {
          currency,
          country,
        },
      })
      .execute()

    return this.processCartResponse(response.body, currentLanguage)
  }

  async addToCart(
    cartId: string,
    productId: string,
    variantId?: string,
    quantity?: number
  ): Promise<CartResponse> {
    let parsedVariantId: number | undefined = undefined
    if (variantId && variantId.trim()) {
      const parsed = Number.parseInt(variantId.trim(), 10)
      if (!Number.isNaN(parsed)) {
        parsedVariantId = parsed
      }
    }

    const actionData: CartUpdateAction = {
      action: 'addLineItem',
      productId,
      variantId: parsedVariantId,
      quantity: quantity ?? 1,
    }

    return this.updateCartWithAction(cartId, actionData)
  }

  async updateCartItem(
    cartId: string,
    lineItemId: string,
    quantity: number
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'changeLineItemQuantity',
      lineItemId,
      quantity,
    }

    return this.updateCartWithAction(cartId, actionData)
  }

  async removeCartItem(
    cartId: string,
    lineItemId: string
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'removeLineItem',
      lineItemId,
    }

    return this.updateCartWithAction(cartId, actionData)
  }

  async setBillingAddress(
    cartId: string,
    address: SetBillingAddressRequest
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'setBillingAddress',
      address,
    }

    return this.updateCartWithAction(cartId, actionData)
  }

  async setShippingAddress(
    cartId: string,
    address: SetShippingAddressRequest
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'setShippingAddress',
      address,
    }

    try {
      // Try to set the shipping address first
      return await this.updateCartWithAction(cartId, actionData)
    } catch (error) {
      // Check if error is about shipping method not having a rate for the zone
      if (this.isShippingMethodZoneError(error)) {
        const actions: CartUpdateAction[] = [
          {
            action: 'setShippingMethod',
          },
          {
            action: 'setShippingAddress',
            address,
          },
        ]

        return this.updateCartWithActions(cartId, actions)
      }

      // Re-throw if it's not a shipping method zone error or if no shipping method exists
      throw error
    }
  }

  private isShippingMethodZoneError(error: unknown): boolean {
    const errorMessage =
      (error as { message?: string; body?: { message?: string } }).message ||
      (error as { body?: { message?: string } }).body?.message ||
      ''
    return errorMessage.includes('does not contain a shipping rate for zone')
  }

  async getShippingMethods(cartId: string): Promise<ShippingMethodsResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const client = await this.getClient()

    // Query shipping methods matching the cart
    const response = await client
      .shippingMethods()
      .matchingCart()
      .get({
        queryArgs: {
          cartId,
        },
      })
      .execute()

    return mapShippingMethodsToResponse(
      response.body.results || [],
      currentLanguage,
      currency
    )
  }

  async setShippingMethod(
    cartId: string,
    request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'setShippingMethod',
      shippingMethod: {
        typeId: 'shipping-method',
        id: request.shippingMethodId,
      },
    }

    return this.updateCartWithAction(cartId, actionData)
  }

  /**
   * Get the customer's active cart
   * @returns The active cart, or null if no active cart exists
   */
  async getActiveCart(): Promise<CartResponse | null> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    try {
      const response = await client
        .me()
        .carts()
        .get({
          queryArgs: {
            limit: 1,
            sort: 'lastModifiedAt desc',
            where: 'cartState="Active"',
            expand: CartService.CART_EXPAND,
          },
        })
        .execute()

      if (response.body.results && response.body.results.length > 0) {
        return this.processCartResponse(
          response.body.results[0],
          currentLanguage
        )
      }

      return null
    } catch {
      return null
    }
  }
}
