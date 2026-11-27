import {
  AddToCartRequestSchema,
  UpdateCartItemRequestSchema,
  RemoveCartItemRequestSchema,
  ApplyDiscountCodeRequestSchema,
  RemoveDiscountCodeRequestSchema,
  type CartResponse,
} from '@core/contracts/cart/cart'
import { BaseService } from '@/lib/bff/services/base-service'
import { toPromoCodeError } from './promo-code-error'
import { Contracts } from '@/lib/contracts'

/**
 * Service for cart operations only (get cart, add/update/remove items).
 * Checkout-related operations (shipping, addresses, payment method) live in lib/bff.
 */
export class CartService extends BaseService {
  /**
   * Get the current cart
   */
  async getCart(): Promise<CartResponse | null> {
    const data = await this.get<CartResponse | null>('/cart', {
      allowEmpty: true,
    })

    if (!data) {
      return null
    }

    return Contracts.cart.parse(data)
  }

  /**
   * Add item to cart
   */
  async addItem(request: {
    productId: string
    variantId?: string
    quantity: number
  }): Promise<CartResponse> {
    const validatedRequest = AddToCartRequestSchema.parse(request)
    const data = await this.post<CartResponse>('/cart/items', validatedRequest)
    return Contracts.cart.parse(data)
  }

  /**
   * Update cart item quantity
   */
  async updateItem(request: {
    lineItemId: string
    quantity: number
  }): Promise<CartResponse> {
    const validatedRequest = UpdateCartItemRequestSchema.parse(request)
    const data = await this.put<CartResponse>('/cart/items', validatedRequest)
    return Contracts.cart.parse(data)
  }

  /**
   * Remove item from cart
   */
  async removeItem(request: { lineItemId: string }): Promise<CartResponse> {
    const validatedRequest = RemoveCartItemRequestSchema.parse(request)
    const data = await this.delete<CartResponse>(
      '/cart/items',
      validatedRequest
    )
    return Contracts.cart.parse(data)
  }

  /** Custom onError because the default handling discards the body, and we need its reason. */
  async applyDiscountCode(request: { code: string }): Promise<CartResponse> {
    const validatedRequest = ApplyDiscountCodeRequestSchema.parse(request)
    const data = await this.post<CartResponse>(
      '/cart/discount-code',
      validatedRequest,
      {
        onError: async (response) => {
          // Fall through so the base service throws RateLimitError.
          if (response.status === 429) {
            return undefined
          }
          throw await toPromoCodeError(response)
        },
      }
    )
    return Contracts.cart.parse(data)
  }

  /** The shop's own cart fields (`contracts.cart`; `null` removes one): the cart with them. */
  async setFields(fields: Record<string, unknown>): Promise<CartResponse> {
    return Contracts.cart.parse(
      await this.put<CartResponse>('/cart/fields', fields)
    )
  }

  /**
   * Remove an applied promo code
   */
  async removeDiscountCode(request: {
    discountCodeId: string
  }): Promise<CartResponse> {
    const validatedRequest = RemoveDiscountCodeRequestSchema.parse(request)
    const data = await this.delete<CartResponse>(
      '/cart/discount-code',
      validatedRequest
    )
    return Contracts.cart.parse(data)
  }

  /**
   * Clear cart ID cookie
   */
  async clearCartId(): Promise<void> {
    await this.delete<void>('/cart')
  }
}
