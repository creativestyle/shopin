import { RequestContext } from '@core/integration-kit'
import { Injectable, NotFoundException, Optional } from '@nestjs/common'
import { CustomerContext } from '@core/integration-kit'
import { PinoLogger } from 'nestjs-pino'
import { getLocalizedString } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import {
  CartResponseSchema,
  DiscountCodeError,
} from '@core/contracts/cart/cart'
import type {
  CartResponse,
  DiscountCodeErrorReason,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
} from '@core/contracts/cart/cart'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import {
  ShippingMethodsResponseSchema,
  SetShippingMethodRequestSchema,
} from '@core/contracts/cart/shipping-method'
import { randomUUID } from 'crypto'
import {
  recalculateCartTotals,
  findLineItem,
  computeGrandTotal,
} from '../helpers/cart-helpers'
import {
  createShopinPrice,
  createShopinLineItem,
} from '../generators/shopin-cart'

// Mirrors the commercetools `deliveryTime` custom field; pickup methods have none
const MOCK_DELIVERY_TIMES: Record<string, Record<string, string>> = {
  standard: { 'de-DE': '2-3 Werktage', 'en-US': '2-3 business days' },
  express: { 'de-DE': '1 Werktag', 'en-US': '1 business day' },
}

// Simple in-memory store for mock carts
// Cart IDs are stored in cookies, so we just need to persist cart data by ID
export const cartStore = new Map<string, CartResponse>()
/** The active cart of each signed-in customer (customer id from the SHOPin session). */
export const customerCarts = new Map<string, string>()
/**
 * Custom fields per cart id: the mock platform's equivalent of a commercetools Custom Type on the cart. Not part
 * of the cart contract; a shop's mapper hook (`mock({ mappers: { cart } })`) reads them.
 */
export const cartFields = new Map<string, Record<string, unknown>>()
/**
 * The customer each cart belongs to (cart id → customer id). A guest's cart has none until a customer uses it
 * (the BFF keeps a guest cart for the customer who signs in with it); a cart with an owner is that customer's only.
 */
export const cartOwners = new Map<string, string>()

/** Fixture codes covering each outcome. Anything unlisted is treated as invalid. */
export const MOCK_DISCOUNT_CODES: Record<
  string,
  { discountInCents: number } | { reason: DiscountCodeErrorReason }
> = {
  SAVE10: { discountInCents: 1000 },
  SAVE5: { discountInCents: 500 },
  EXPIRED: { reason: 'expired' },
  NOTYET: { reason: 'notApplicable' },
}

@Injectable()
export class CartService {
  constructor(
    private readonly languageProvider: RequestContext,
    private readonly logger: PinoLogger,
    @Optional() private readonly customer?: CustomerContext
  ) {
    this.logger.setContext(CartService.name)
  }

  async getCart(cartId: string): Promise<CartResponse> {
    const cart = cartStore.get(cartId)
    const customerId = await this.customer?.customerId()
    const owner = cartOwners.get(cartId)
    // another shopper's cart is not found: a customer's cart is that customer's only
    if (!cart || (owner !== undefined && owner !== customerId)) {
      this.logger.warn({ cartId }, 'Cart not found')
      throw new NotFoundException(`Cart not found: ${cartId}`)
    }
    if (customerId && owner === undefined) {
      // a guest cart the customer signed in with becomes theirs
      cartOwners.set(cartId, customerId)
      customerCarts.set(customerId, cartId)
    }
    return CartResponseSchema.parse(cart)
  }

  /** The shop's own fields of the cart (`setCartFields` of the port): kept beside it, `null` removes one. */
  async setFields(
    cartId: string,
    fields: Record<string, unknown>
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const kept = { ...cartFields.get(cartId) }
    for (const [name, value] of Object.entries(fields)) {
      if (value === null || value === undefined) {
        delete kept[name]
      } else {
        kept[name] = value
      }
    }
    cartFields.set(cartId, kept)
    return cart
  }

  async createCart(): Promise<CartResponse> {
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const resolvedCurrency = resolveCurrencyFromLanguage(currentLanguage)
    const cartId = `mock-cart-${randomUUID()}`
    const cart: CartResponse = {
      id: cartId,
      version: 1,
      lineItems: [],
      subtotal: createShopinPrice(0, resolvedCurrency),
      grandTotal: createShopinPrice(0, resolvedCurrency),
      currency: resolvedCurrency,
      itemCount: 0,
    }
    cartStore.set(cartId, cart)
    const customerId = await this.customer?.customerId()
    if (customerId) {
      customerCarts.set(customerId, cartId)
      cartOwners.set(cartId, customerId)
    }
    return CartResponseSchema.parse(cart)
  }

  async addToCart(
    cartId: string,
    productId: string,
    variantId?: string,
    quantity?: number
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const resolvedQuantity = quantity ?? 1
    const itemPriceInCents = 1000
    const newLineItem = createShopinLineItem(
      productId,
      variantId,
      resolvedQuantity,
      cart.currency,
      itemPriceInCents
    )

    const priceDiff = itemPriceInCents * resolvedQuantity
    const updatedCart: CartResponse = {
      ...cart,
      lineItems: [...cart.lineItems, newLineItem],
      ...recalculateCartTotals(cart, priceDiff, resolvedQuantity),
    }

    cartStore.set(cartId, updatedCart)
    return updatedCart
  }

  async updateCartItem(
    cartId: string,
    lineItemId: string,
    quantity: number
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const { lineItem, index } = findLineItem(cart, lineItemId)

    const quantityDiff = quantity - lineItem.quantity
    const priceDiff = lineItem.price.regularPriceInCents * quantityDiff

    const updatedLineItems = [...cart.lineItems]
    updatedLineItems[index] = {
      ...lineItem,
      quantity,
    }

    const updatedCart: CartResponse = {
      ...cart,
      lineItems: updatedLineItems,
      ...recalculateCartTotals(cart, priceDiff, quantityDiff),
    }

    cartStore.set(cartId, updatedCart)
    return updatedCart
  }

  async removeCartItem(
    cartId: string,
    lineItemId: string
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const { lineItem } = findLineItem(cart, lineItemId)

    const priceDiff = -lineItem.price.regularPriceInCents * lineItem.quantity
    const quantityDiff = -lineItem.quantity

    const updatedLineItems = cart.lineItems.filter(
      (item) => item.id !== lineItemId
    )

    const updatedCart: CartResponse = {
      ...cart,
      lineItems: updatedLineItems,
      ...recalculateCartTotals(cart, priceDiff, quantityDiff),
    }

    cartStore.set(cartId, updatedCart)
    return updatedCart
  }

  async addDiscountCode(cartId: string, code: string): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const normalizedCode = code.trim().toUpperCase()

    if (cart.discountCodes?.some((entry) => entry.applied)) {
      throw new DiscountCodeError('alreadyApplied')
    }

    const fixture = MOCK_DISCOUNT_CODES[normalizedCode]
    if (!fixture) {
      throw new DiscountCodeError('invalid')
    }
    if ('reason' in fixture) {
      throw new DiscountCodeError(fixture.reason)
    }

    const discountAmount = createShopinPrice(
      fixture.discountInCents,
      cart.currency
    )
    const updatedCart: CartResponse = {
      ...cart,
      discountCodes: [
        {
          id: `mock-discount-${normalizedCode}`,
          code: normalizedCode,
          applied: true,
        },
      ],
      discountAmount,
      grandTotal: computeGrandTotal({ ...cart, discountAmount }),
    }

    cartStore.set(cartId, updatedCart)
    return CartResponseSchema.parse(updatedCart)
  }

  async removeDiscountCode(
    cartId: string,
    discountCodeId: string
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const remaining = (cart.discountCodes ?? []).filter(
      (entry) => entry.id !== discountCodeId
    )

    const updatedCart: CartResponse = {
      ...cart,
      discountCodes: remaining.length > 0 ? remaining : undefined,
      discountAmount: undefined,
      grandTotal: computeGrandTotal({ ...cart, discountAmount: undefined }),
    }

    cartStore.set(cartId, updatedCart)
    return CartResponseSchema.parse(updatedCart)
  }

  async getActiveCart(): Promise<CartResponse | null> {
    // The signed-in customer's cart; a guest has no active cart outside the cart cookie
    const customerId = await this.customer?.customerId()
    const cartId = customerId ? customerCarts.get(customerId) : undefined
    const cart = cartId ? cartStore.get(cartId) : undefined
    return cart ? CartResponseSchema.parse(cart) : null
  }

  async setBillingAddress(
    cartId: string,
    address: SetBillingAddressRequest
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const updatedCart: CartResponse = {
      ...cart,
      billingAddress: address,
    }
    cartStore.set(cartId, updatedCart)
    return updatedCart
  }

  async setShippingAddress(
    cartId: string,
    address: SetShippingAddressRequest
  ): Promise<CartResponse> {
    const cart = await this.getCart(cartId)
    const updatedCart: CartResponse = {
      ...cart,
      shippingAddress: address,
    }
    cartStore.set(cartId, updatedCart)
    return updatedCart
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getShippingMethods(cartId: string): Promise<ShippingMethodsResponse> {
    // Mock shipping methods - in real implementation, this would query commercetools
    // cartId is not used in mock implementation but required by interface
    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)

    const mockShippingMethods = [
      {
        id: 'standard',
        localizedName: {
          'de-DE': 'DHL Standardlieferung',
          'en-US': 'DHL Standard Delivery',
        },
        price: {
          regularPriceInCents: 0,
          currency: currency,
          fractionDigits: 2,
        },
        isDefault: true,
      },
      {
        id: 'express',
        localizedName: {
          'de-DE': 'DHL Expresslieferung',
          'en-US': 'DHL Express Delivery',
        },
        price: {
          regularPriceInCents: 300,
          currency: currency,
          fractionDigits: 2,
        },
        isDefault: false,
      },
      {
        id: 'packstation',
        localizedName: {
          'de-DE': 'DHL Packstation',
          'en-US': 'DHL Packstation',
        },
        price: {
          regularPriceInCents: 0,
          currency: currency,
          fractionDigits: 2,
        },
        isDefault: false,
      },
      {
        id: 'store',
        localizedName: {
          'de-DE': 'Abholung im Store',
          'en-US': 'Store Pickup',
        },
        localizedDescription: {
          'de-DE': 'Kostenlos in einen SHOPIN Store',
          'en-US': 'Free to a SHOPIN Store',
        },
        price: {
          regularPriceInCents: 0,
          currency: currency,
          fractionDigits: 2,
        },
        isDefault: false,
      },
    ]

    return ShippingMethodsResponseSchema.parse({
      shippingMethods: mockShippingMethods.map(
        ({ localizedName, localizedDescription, ...method }) => ({
          ...method,
          name: getLocalizedString(localizedName, currentLanguage),
          description: getLocalizedString(
            localizedDescription,
            currentLanguage
          ),
          deliveryTime: getLocalizedString(
            MOCK_DELIVERY_TIMES[method.id],
            currentLanguage
          ),
        })
      ),
    })
  }

  async setShippingMethod(
    cartId: string,
    request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetShippingMethodRequestSchema.parse(request)
    const cart = await this.getCart(cartId)

    if (!validatedRequest.shippingMethodId) {
      const updatedCart: CartResponse = {
        ...cart,
        shippingInfo: undefined,
        grandTotal: computeGrandTotal({ ...cart, shippingInfo: undefined }),
      }
      cartStore.set(cartId, updatedCart)
      return updatedCart
    }

    // Get shipping method details
    const shippingMethods = await this.getShippingMethods(cartId)
    const selectedMethod = shippingMethods.shippingMethods.find(
      (m) => m.id === validatedRequest.shippingMethodId
    )

    if (!selectedMethod) {
      throw new NotFoundException(
        `Shipping method not found: ${validatedRequest.shippingMethodId}`
      )
    }

    const shippingInfo: CartResponse['shippingInfo'] = {
      shippingMethodId: selectedMethod.id,
      shippingMethodName: selectedMethod.name,
      deliveryTime: getLocalizedString(
        MOCK_DELIVERY_TIMES[selectedMethod.id],
        this.languageProvider.getCurrentLanguage()
      ),
      price: selectedMethod.price,
    }
    const updatedCart: CartResponse = {
      ...cart,
      shippingInfo,
      grandTotal: computeGrandTotal({ ...cart, shippingInfo }),
    }
    cartStore.set(cartId, updatedCart)
    return updatedCart
  }
}
