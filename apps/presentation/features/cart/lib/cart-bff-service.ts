import {
  AddToCartRequestSchema,
  UpdateCartItemRequestSchema,
  RemoveCartItemRequestSchema,
  CartResponseSchema,
  ApplyDiscountCodeRequestSchema,
  RemoveDiscountCodeRequestSchema,
  type CartResponse,
} from '@core/contracts/cart/cart'
import { BaseService } from '@/lib/bff/services/base-service'
import { toPromoCodeError } from './promo-code-error'

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

    return CartResponseSchema.parse(data)
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
    return CartResponseSchema.parse(data)
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
    return CartResponseSchema.parse(data)
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
    return CartResponseSchema.parse(data)
  }

  /**
   * Apply a promo code. Throws PromoCodeError carrying the rejection reason,
   * since the default error handling discards the response body.
   */
  async applyDiscountCode(request: { code: string }): Promise<CartResponse> {
    const validatedRequest = ApplyDiscountCodeRequestSchema.parse(request)
    const data = await this.post<CartResponse>(
      '/cart/discount-code',
      validatedRequest,
      {
        onError: async (response) => {
          throw await toPromoCodeError(response)
        },
      }
    )
    return CartResponseSchema.parse(data)
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
    return CartResponseSchema.parse(data)
  }

  /**
   * Clear cart ID cookie
   */
  async clearCartId(): Promise<void> {
    await this.delete<void>('/cart')
  }
}
