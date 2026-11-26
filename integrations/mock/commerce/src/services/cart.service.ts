import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { LANGUAGE_TOKEN, getLocalizedString } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import type { LanguageProvider } from '@core/contracts/core/request-providers'
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
import { MockSessionService } from '../session/mock-session.service'
import { getSessionCustomerId } from '../session/mock-session-store'

// Mirrors the commercetools `deliveryTime` custom field; pickup methods have none
const MOCK_DELIVERY_TIMES: Record<string, Record<string, string>> = {
  standard: { 'de-DE': '2-3 Werktage', 'en-US': '2-3 business days' },
  express: { 'de-DE': '1 Werktag', 'en-US': '1 business day' },
}

// Simple in-memory store for mock carts
// Cart IDs are stored in cookies, so we just need to persist cart data by ID
export const cartStore = new Map<string, CartResponse>()
// Cart id -> mock session that created it; a signed-in session's carts belong to its customer
export const cartOwnerStore = new Map<string, string>()

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

const ownCartIds = (owns: (sessionId: string) => boolean) =>
  [...cartOwnerStore]
    .filter(([cartId, sessionId]) => cartStore.has(cartId) && owns(sessionId))
    .map(([cartId]) => cartId)

function mergeLineItems(target: CartResponse, source: CartResponse) {
  let merged = target
  for (const item of source.lineItems) {
    const index = merged.lineItems.findIndex(
      (existing) =>
        existing.productId === item.productId &&
        existing.variantId === item.variantId
    )
    const lineItems = [...merged.lineItems]
    if (index === -1) {
      lineItems.push(item)
    } else {
      lineItems[index] = {
        ...lineItems[index],
        quantity: lineItems[index].quantity + item.quantity,
      }
    }
    merged = {
      ...merged,
      lineItems,
      ...recalculateCartTotals(
        merged,
        item.price.regularPriceInCents * item.quantity,
        item.quantity
      ),
    }
  }
  return merged
}

/**
 * At sign-in, like commercetools' merge mode: the guest's line items join the
 * customer's active cart, or the guest cart becomes theirs when they have none.
 */
export function moveGuestCartsToCustomer(
  guestSessionId: string,
  customerSessionId: string,
  customerId: string
) {
  const customerCartId = ownCartIds(
    (sessionId) => getSessionCustomerId(sessionId) === customerId
  ).at(-1)
  for (const guestCartId of ownCartIds((id) => id === guestSessionId)) {
    const guestCart = cartStore.get(guestCartId)!
    const customerCart = customerCartId && cartStore.get(customerCartId)
    if (!customerCart || customerCart.currency !== guestCart.currency) {
      cartOwnerStore.set(guestCartId, customerSessionId)
      continue
    }
    cartStore.set(customerCartId, mergeLineItems(customerCart, guestCart))
    cartStore.delete(guestCartId)
    cartOwnerStore.delete(guestCartId)
  }
}

@Injectable()
export class CartService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly logger: PinoLogger,
    private readonly sessionService: MockSessionService
  ) {
    this.logger.setContext(CartService.name)
  }

  async getCart(cartId: string): Promise<CartResponse> {
    const cart = cartStore.get(cartId)
    if (!cart) {
      this.logger.warn({ cartId }, 'Cart not found')
      throw new NotFoundException(`Cart not found: ${cartId}`)
    }
    return CartResponseSchema.parse(cart)
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
    const sessionId = await this.sessionService.getSessionId()
    if (sessionId) {
      cartOwnerStore.set(cartId, sessionId)
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
    const customerId = await this.sessionService.getCustomerId()
    if (!customerId) {
      return null
    }
    // Newest cart of any session the customer owns, as commercetools' activeCart
    const activeCartId = ownCartIds(
      (sessionId) => getSessionCustomerId(sessionId) === customerId
    ).at(-1)
    return activeCartId ? this.getCart(activeCartId) : null
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
          centAmount: 0,
          currencyCode: currency,
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
          centAmount: 300,
          currencyCode: currency,
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
          centAmount: 0,
          currencyCode: currency,
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
          centAmount: 0,
          currencyCode: currency,
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
      price: {
        regularPriceInCents: selectedMethod.price.centAmount,
        currency: selectedMethod.price.currencyCode,
        fractionDigits: 2,
      },
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
