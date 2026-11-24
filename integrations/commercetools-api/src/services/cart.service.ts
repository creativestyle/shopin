import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { resolveCountryFromLanguage } from '@core/i18n/language-tag-utils'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type {
  CartResponse,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
} from '@core/contracts/cart/cart'
import {
  CartResponseSchema,
  CartVersionConflictError,
  DiscountCodeError,
} from '@core/contracts/cart/cart'
import type {
  AddDiscountCodeOptions,
  GetCartOptions as ContractGetCartOptions,
} from '@core/contracts/core/data-source-interfaces'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import { UserClientService } from '../client/user-client.service'
import { ServerClientService } from '../client/server-client.service'
import { mapCartToResponse } from '../mappers/cart'
import { mapShippingMethodsToResponse } from '../mappers/shipping-method'
import { buildInClause } from '../helpers/build-in-clause'
import {
  findRejectedDiscountCode,
  toDiscountCodeError,
} from '../helpers/discount-code'
import {
  CART_INVENTORY_MODE,
  CART_LINE_ITEM_MAX_QUANTITY,
} from '@config/constants'
import { CartApiResponseSchema, type CartApiResponse } from '../schemas/cart'
import {
  isConcurrentModificationError,
  isNotFoundError,
} from '../helpers/is-not-found-error'
import {
  CartUpdateActionSchema,
  type CartUpdateAction,
} from '../schemas/cart-update-action'

interface GetCartOptions extends ContractGetCartOptions {
  expand?: string[]
}

function toStockKey(sku: string, supplyChannelId?: string): string {
  return JSON.stringify([sku, supplyChannelId ?? null])
}

// Never exposes more than the per-line cap, so raw stock levels stay hidden
function toMaxQuantity(availableQuantity: number): number {
  return Math.min(Math.max(0, availableQuantity), CART_LINE_ITEM_MAX_QUANTITY)
}

@Injectable({ scope: Scope.REQUEST })
export class CartService {
  private static readonly CART_EXPAND = [
    'lineItems[*].product',
    'lineItems[*].variant',
    'lineItems[*].product.productType',
    'paymentInfo.payments[*]',
    // Required to read the shopper-facing code; CT returns only a reference id otherwise.
    'discountCodes[*].discountCode',
  ] satisfies string[]
  private static readonly INVENTORY_PAGE_LIMIT = 500

  constructor(
    private readonly userClientService: UserClientService,
    private readonly serverClientService: ServerClientService,
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
    actionData: unknown,
    withInventory = false
  ): Promise<CartResponse> {
    return this.updateCartWithActions(cartId, [actionData], withInventory)
  }

  private async getCartVersion(cartId: string): Promise<number> {
    const client = await this.getClient()
    try {
      const response = await client
        .me()
        .carts()
        .withId({ ID: cartId })
        .get()
        .execute()

      return CartApiResponseSchema.parse(response.body).version
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException(`Cart not found: ${cartId}`)
      }
      throw error
    }
  }

  private async processCartResponse(
    responseBody: unknown,
    currentLanguage: string,
    withInventory = false
  ): Promise<CartResponse> {
    const validatedCart = CartApiResponseSchema.parse(responseBody)
    const mappedCart = mapCartToResponse(validatedCart, currentLanguage)
    const cart = withInventory
      ? await this.enrichWithInventory(validatedCart, mappedCart)
      : mappedCart
    return CartResponseSchema.parse(cart)
  }

  private async enrichWithInventory(
    apiCart: CartApiResponse,
    cart: CartResponse
  ): Promise<CartResponse> {
    const stockKeyByLineItemId = new Map<string, string>()
    const skus = new Set<string>()

    for (const item of apiCart.lineItems ?? []) {
      const sku = item.variant?.sku
      const inventoryMode = item.inventoryMode ?? apiCart.inventoryMode
      if (!sku || inventoryMode == null || inventoryMode === 'None') {
        continue
      }
      skus.add(sku)
      stockKeyByLineItemId.set(item.id, toStockKey(sku, item.supplyChannel?.id))
    }

    if (skus.size === 0) {
      return cart
    }

    try {
      const stockByKey = await this.getStockByKey([...skus])

      if (stockByKey.size === 0) {
        return cart
      }

      return {
        ...cart,
        lineItems: cart.lineItems.map((item) => {
          const stockKey = stockKeyByLineItemId.get(item.id)
          const availableQuantity = stockKey
            ? stockByKey.get(stockKey)
            : undefined

          return availableQuantity == null
            ? item
            : { ...item, maxQuantity: toMaxQuantity(availableQuantity) }
        }),
      }
    } catch (error) {
      Logger.warn(
        'Failed to fetch inventory for cart line items',
        error,
        CartService.name
      )
      return cart
    }
  }

  private async getStockByKey(skus: string[]): Promise<Map<string, number>> {
    const client = this.serverClientService.getClient()
    const stockByKey = new Map<string, number>()
    let offset = 0

    while (true) {
      const response = await client
        .inventory()
        .get({
          queryArgs: {
            where: buildInClause('sku', skus),
            limit: CartService.INVENTORY_PAGE_LIMIT,
            offset,
          },
        })
        .execute()

      const results = response.body.results ?? []

      for (const entry of results) {
        if (entry.sku == null || entry.availableQuantity == null) {
          continue
        }
        stockByKey.set(
          toStockKey(entry.sku, entry.supplyChannel?.id),
          entry.availableQuantity
        )
      }

      if (results.length < CartService.INVENTORY_PAGE_LIMIT) {
        return stockByKey
      }

      offset += results.length
    }
  }

  private mapValidatedCart(
    cart: CartApiResponse,
    currentLanguage: string
  ): CartResponse {
    return CartResponseSchema.parse(mapCartToResponse(cart, currentLanguage))
  }

  /** Returns the raw CT response so callers can read fields the mapped shape drops. */
  private async updateCartWithActionsRaw(
    cartId: string,
    actionsData: unknown[],
    expectedVersion?: number
  ): Promise<unknown> {
    const client = await this.getClient()

    const cartVersion = expectedVersion ?? (await this.getCartVersion(cartId))

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

    return response.body
  }

  async updateCartWithActions(
    cartId: string,
    actionsData: unknown[],
    withInventory = false
  ): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const responseBody = await this.updateCartWithActionsRaw(
      cartId,
      actionsData
    )
    return this.processCartResponse(
      responseBody,
      currentLanguage,
      withInventory
    )
  }

  async getCart(
    cartId: string,
    {
      expand = CartService.CART_EXPAND,
      withInventory = true,
    }: GetCartOptions = {}
  ): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()
    try {
      const response = await client
        .me()
        .carts()
        .withId({ ID: cartId })
        .get({
          queryArgs: {
            expand,
          },
        })
        .execute()

      return this.processCartResponse(
        response.body,
        currentLanguage,
        withInventory
      )
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException(`Cart not found: ${cartId}`)
      }
      throw error
    }
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
          inventoryMode: CART_INVENTORY_MODE,
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

    return this.updateCartWithAction(cartId, actionData, true)
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

    return this.updateCartWithAction(cartId, actionData, true)
  }

  async removeCartItem(
    cartId: string,
    lineItemId: string
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'removeLineItem',
      lineItemId,
    }

    return this.updateCartWithAction(cartId, actionData, true)
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

  /** A code CT accepts but does not apply is rolled back, so the cart never holds a dud. */
  async addDiscountCode(
    cartId: string,
    code: string,
    {
      replaceDiscountCodeIds = [],
      expectedVersion,
    }: AddDiscountCodeOptions = {}
  ): Promise<CartResponse> {
    const actions: CartUpdateAction[] = [
      ...replaceDiscountCodeIds.map(
        (id): CartUpdateAction => ({
          action: 'removeDiscountCode',
          discountCode: { typeId: 'discount-code', id },
        })
      ),
      { action: 'addDiscountCode', code },
    ]

    let responseBody: unknown
    try {
      responseBody = await this.updateCartWithActionsRaw(
        cartId,
        actions,
        expectedVersion
      )
    } catch (error) {
      if (isConcurrentModificationError(error)) {
        throw new CartVersionConflictError()
      }
      throw toDiscountCodeError(error)
    }

    // The POST already expands discountCodes, so the state is in hand — no re-fetch needed.
    const rawCart = CartApiResponseSchema.parse(responseBody)
    const rejection = findRejectedDiscountCode(rawCart, code)
    if (rejection) {
      await this.removeDiscountCode(cartId, rejection.id).catch((error) => {
        // The code stays on the cart; it maps as not applied, so it can still be removed.
        Logger.warn(
          `Failed to roll back discount code ${rejection.id} on cart ${cartId}`,
          error,
          CartService.name
        )
      })
      throw new DiscountCodeError(rejection.reason)
    }

    return this.mapValidatedCart(rawCart, await this.getCurrentLanguage())
  }

  async removeDiscountCode(
    cartId: string,
    discountCodeId: string
  ): Promise<CartResponse> {
    const actionData: CartUpdateAction = {
      action: 'removeDiscountCode',
      discountCode: {
        typeId: 'discount-code',
        id: discountCodeId,
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
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const client = await this.getClient()

    try {
      const response = await client
        .me()
        .carts()
        .get({
          queryArgs: {
            limit: 1,
            sort: 'lastModifiedAt desc',
            where: `cartState="Active" and totalPrice(currencyCode="${currency}")`,
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
