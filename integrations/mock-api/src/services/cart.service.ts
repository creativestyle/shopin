import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import type {
  CartResponse,
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
import { recalculateCartTotals, findLineItem } from '../helpers/cart-helpers'
import {
  createShopinPrice,
  createShopinLineItem,
} from '../generators/shopin-cart'

// Simple in-memory store for mock carts
// Cart IDs are stored in cookies, so we just need to persist cart data by ID
export const cartStore = new Map<string, CartResponse>()

@Injectable()
export class CartService {
  constructor(
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly logger: PinoLogger
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

  async getActiveCart(): Promise<CartResponse | null> {
    // For mock, return the most recently created cart (simple implementation)
    // In a real scenario, this would query by customer ID and cart state
    const carts = Array.from(cartStore.values())
    if (carts.length === 0) {
      return null
    }
    // Return the last cart (simplified - in real scenario would filter by customer and state)
    return carts[carts.length - 1]
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
        name: 'DHL Standardlieferung',
        localizedDescription: {
          de: 'DHL Standardlieferung (2-3 Werktagen)',
          en: 'DHL Standard Delivery (2-3 business days)',
        },
        price: {
          centAmount: 0,
          currencyCode: currency,
        },
        isDefault: true,
      },
      {
        id: 'express',
        name: 'DHL Expresslieferung',
        localizedDescription: {
          de: 'DHL Expresslieferung (1 Werktag)',
          en: 'DHL Express Delivery (1 business day)',
        },
        price: {
          centAmount: 300,
          currencyCode: currency,
        },
        isDefault: false,
      },
      {
        id: 'packstation',
        name: 'DHL Packstation',
        localizedDescription: {
          de: 'DHL Packstation',
          en: 'DHL Packstation',
        },
        price: {
          centAmount: 0,
          currencyCode: currency,
        },
        isDefault: false,
      },
      {
        id: 'store',
        name: 'Store Pickup',
        localizedDescription: {
          de: 'Kostenlos in einen SHOPIN Store',
          en: 'Free to a SHOPIN Store',
        },
        price: {
          centAmount: 0,
          currencyCode: currency,
        },
        isDefault: false,
      },
    ]

    return ShippingMethodsResponseSchema.parse({
      shippingMethods: mockShippingMethods,
    })
  }

  async setShippingMethod(
    cartId: string,
    request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    const validatedRequest = SetShippingMethodRequestSchema.parse(request)
    const cart = await this.getCart(cartId)

    if (!validatedRequest.shippingMethodId) {
      // Remove shipping method - recalculate grand total
      const previousShippingCents =
        cart.shippingInfo?.price.regularPriceInCents || 0
      const newGrandTotalCents =
        cart.grandTotal.regularPriceInCents - previousShippingCents

      const updatedCart: CartResponse = {
        ...cart,
        shippingInfo: undefined,
        grandTotal: createShopinPrice(newGrandTotalCents, cart.currency),
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

    // Calculate shipping cost difference
    const previousShippingCents =
      cart.shippingInfo?.price.regularPriceInCents || 0
    const newShippingCents = selectedMethod.price.centAmount
    const shippingDiff = newShippingCents - previousShippingCents

    // Recalculate grand total with new shipping cost
    const newGrandTotalCents =
      cart.grandTotal.regularPriceInCents + shippingDiff

    const updatedCart: CartResponse = {
      ...cart,
      shippingInfo: {
        shippingMethodId: selectedMethod.id,
        shippingMethodName: selectedMethod.name,
        price: {
          regularPriceInCents: selectedMethod.price.centAmount,
          currency: selectedMethod.price.currencyCode,
          fractionDigits: 2,
        },
      },
      grandTotal: createShopinPrice(newGrandTotalCents, cart.currency),
    }
    cartStore.set(cartId, updatedCart)
    return updatedCart
  }
}
