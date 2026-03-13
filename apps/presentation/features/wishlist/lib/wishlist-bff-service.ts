import {
  AddToWishlistRequestSchema,
  RemoveFromWishlistRequestSchema,
  WishlistResponseSchema,
  type WishlistResponse,
} from '@core/contracts/wishlist/wishlist'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for wishlist operations.
 */
export class WishlistBffService extends BaseService {
  /**
   * Get the current wishlist with optional pagination
   * @param page - Page number (1-indexed) for pagination
   * @param limit - Maximum number of items to return per page
   */
  async getWishlist(
    page?: number,
    limit?: number
  ): Promise<WishlistResponse | null> {
    const data = await this.get<WishlistResponse | null>('/wishlist', {
      allowEmpty: true,
      queryParams: {
        page,
        limit,
      },
    })

    if (!data) {
      return null
    }

    return WishlistResponseSchema.parse(data)
  }

  /**
   * Add item to wishlist
   */
  async addItem(request: {
    productId?: string
    variantId?: string
  }): Promise<WishlistResponse> {
    const validatedRequest = AddToWishlistRequestSchema.parse(request)
    const data = await this.post<WishlistResponse>(
      '/wishlist/items',
      validatedRequest
    )
    return WishlistResponseSchema.parse(data)
  }

  /**
   * Remove item from wishlist
   */
  async removeItem(request: { lineItemId: string }): Promise<WishlistResponse> {
    const validatedRequest = RemoveFromWishlistRequestSchema.parse(request)
    const data = await this.delete<WishlistResponse>(
      '/wishlist/items',
      validatedRequest
    )
    return WishlistResponseSchema.parse(data)
  }
}
