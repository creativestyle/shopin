import { RequestContext } from '@core/integration-kit'
import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
  Optional,
} from '@nestjs/common'
import type {
  Cart,
  CartUpdateAction as SdkCartUpdateAction,
} from '@commercetools/platform-sdk'
import { MapperHooks } from '../mapper-hooks'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { resolveCountryFromLanguage } from '@core/i18n/language-tag-utils'
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
import type { AddDiscountCodeOptions } from '@core/contracts/core/data-source-interfaces'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import type { GetCartOptions as ContractGetCartOptions } from '@core/contracts/core/data-source-interfaces'
import { CustomerScope } from '../shared/customer-scope.service'
import {
  COMMERCETOOLS_CLIENT,
  type Client,
} from '@integrations/commercetools-core'
import { mapCartToResponse } from '../mappers/cart'
import { mapShippingMethodsToResponse } from '../mappers/shipping-method'
import { buildInClause } from '../helpers/build-in-clause'
import { hasStatusCode } from '../helpers/has-status-code'
import {
  findRejectedDiscountCode,
  toDiscountCodeError,
} from '../helpers/discount-code'
import {
  CART_INVENTORY_MODE,
  CART_LINE_ITEM_MAX_QUANTITY,
} from '@config/constants'
import { CartApiResponseSchema, type CartApiResponse } from '../schemas/cart'
import { isConcurrentModificationError } from '../helpers/is-not-found-error'
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

@Injectable()
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
  /** The Custom Type a cart without one gets for the shop's fields (create it in the project with those fields). */
  static readonly CART_FIELDS_TYPE = 'shop-cart-fields'

  constructor(
    private readonly scope: CustomerScope,
    @Inject(COMMERCETOOLS_CLIENT) private readonly server: Client,
    private readonly languageProvider: RequestContext,
    @Optional() private readonly hooks?: MapperHooks
  ) {}

  private async getCurrentLanguage(): Promise<string> {
    return this.languageProvider.getCurrentLanguage()
  }

  private async getClient() {
    return this.scope.client()
  }

  private async updateCartWithAction(
    cartId: string,
    actionData: unknown,
    withInventory = false
  ): Promise<CartResponse> {
    return this.updateCartWithActions(cartId, [actionData], withInventory)
  }

  private async processCartResponse(
    responseBody: unknown,
    currentLanguage: string,
    withInventory = false
  ): Promise<CartResponse> {
    const validatedCart = CartApiResponseSchema.parse(responseBody)
    const mappedCart = mapCartToResponse(validatedCart, currentLanguage)
    const cart = CartResponseSchema.parse(
      withInventory
        ? await this.enrichWithInventory(validatedCart, mappedCart)
        : mappedCart
    )
    // the shop's hook gets the cart as commercetools returned it (custom fields included)
    return this.hooks?.cart ? this.hooks.cart(responseBody as Cart, cart) : cart
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

  // Inventory entries are project data, not the shopper's: read with the server client
  private async getStockByKey(skus: string[]): Promise<Map<string, number>> {
    const stockByKey = new Map<string, number>()
    let offset = 0

    while (true) {
      const response = await this.server
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
    const api = await this.scope.api()

    // the version the caller checked, else the cart's own (reading it checks the cart is this shopper's)
    const cartVersion =
      expectedVersion ?? (await api.carts.get(cartId, [])).version

    const validatedActions = actionsData.map((actionData) =>
      CartUpdateActionSchema.parse(actionData)
    )

    return api.carts.update(
      cartId,
      cartVersion,
      validatedActions as never,
      CartService.CART_EXPAND
    )
  }

  async updateCartWithActions(
    cartId: string,
    actionsData: unknown[],
    withInventory = false
  ): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const updated = await this.updateCartWithActionsRaw(cartId, actionsData)

    return this.processCartResponse(updated, currentLanguage, withInventory)
  }

  /**
   * The shop's own cart fields as Custom Fields of the cart. A cart without a Custom Type gets `shop-cart-fields`;
   * a cart that already has a type (the project's own) keeps it, and the fields must be on that type (else 501,
   * naming the type and the fields). `null` removes a field. One retry when the cart changed in between (409).
   */
  async setFields(
    cartId: string,
    fields: Record<string, unknown>
  ): Promise<CartResponse> {
    const api = await this.scope.api()
    for (let attempt = 0; ; attempt++) {
      // the shopper's own cart only (any other id answers 404)
      const cart = await api.carts.get(cartId, [])
      const actions = await this.fieldActions(cart, fields)
      try {
        const updated = await api.carts.update(
          cartId,
          cart.version,
          actions,
          CartService.CART_EXPAND
        )
        return this.processCartResponse(
          updated,
          await this.getCurrentLanguage(),
          true
        )
      } catch (error) {
        if (!(hasStatusCode(error) && error.statusCode === 409)) {
          throw error
        }
        if (attempt > 0) {
          throw new BadGatewayException('commercetools: the cart kept changing')
        }
      }
    }
  }

  private async fieldActions(
    cart: Cart,
    fields: Record<string, unknown>
  ): Promise<SdkCartUpdateAction[]> {
    const set = Object.entries(fields)
    if (!cart.custom) {
      return [
        {
          action: 'setCustomType',
          type: { typeId: 'type', key: CartService.CART_FIELDS_TYPE },
          fields: Object.fromEntries(set.filter(([, v]) => v != null)),
        },
      ]
    }
    const type = (
      await this.server
        .types()
        .withId({ ID: cart.custom.type.id })
        .get()
        .execute()
    ).body
    const known = new Set(type.fieldDefinitions.map((f) => f.name))
    const missing = set.map(([name]) => name).filter((n) => !known.has(n))
    if (missing.length) {
      throw new NotImplementedException(
        `cart fields: the cart's Custom Type "${type.key ?? type.id}" has no field ${missing.join(', ')}: add them to that type`
      )
    }
    return set.map(([name, value]) => ({
      action: 'setCustomField',
      name,
      value: value ?? undefined,
    }))
  }

  async getCart(
    cartId: string,
    {
      expand = CartService.CART_EXPAND,
      withInventory = true,
    }: GetCartOptions = {}
  ): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const cart = await (await this.scope.api()).carts.get(cartId, expand)

    return this.processCartResponse(cart, currentLanguage, withInventory)
  }

  async createCart(): Promise<CartResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)
    const country = resolveCountryFromLanguage(currentLanguage)
    const cart = await (
      await this.scope.api()
    ).carts.create({ currency, country, inventoryMode: CART_INVENTORY_MODE })

    return this.processCartResponse(cart, currentLanguage)
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
    // only for this shopper's cart
    await (await this.scope.api()).carts.get(cartId, [])
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
    try {
      const response = await (
        await this.scope.api()
      ).carts.query({
        limit: 1,
        sort: 'lastModifiedAt desc',
        where: `cartState="Active" and totalPrice(currencyCode="${currency}")`,
        expand: CartService.CART_EXPAND,
      })

      if (response.results && response.results.length > 0) {
        return this.processCartResponse(response.results[0], currentLanguage)
      }

      return null
    } catch {
      return null
    }
  }
}
