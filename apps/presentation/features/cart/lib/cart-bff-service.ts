import {
  AddToCartRequestSchema,
  UpdateCartItemRequestSchema,
  RemoveCartItemRequestSchema,
  CartResponseSchema,
  type CartResponse,
} from '@core/contracts/cart/cart'
import { BaseService } from '@/lib/bff/services/base-service'

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
   * Clear cart ID cookie
   */
  async clearCartId(): Promise<void> {
    await this.delete<void>('/cart')
  }
}
