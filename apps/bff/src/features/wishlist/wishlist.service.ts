import { Injectable, Logger } from '@nestjs/common'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import type {
  WishlistResponse,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
} from '@core/contracts/wishlist/wishlist'
import { WishlistIdService } from '../wishlist-id/wishlist-id.service'
import { TokenProvider } from '../../common/token-management/token-provider'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { BaseAuthenticatedService } from '../auth/base-authenticated.service'

@Injectable()
export class WishlistService extends BaseAuthenticatedService {
  private readonly logger = new Logger(WishlistService.name)

  constructor(
    dataSourceFactory: DataSourceFactory,
    private readonly wishlistIdService: WishlistIdService,
    tokenProvider: TokenProvider,
    tokenStorageService: TokenStorageService
  ) {
    super(tokenProvider, tokenStorageService, dataSourceFactory)
  }

  private getWishlistService() {
    return this.dataSourceFactory.getServices().wishlistService
  }

  async getWishlist(
    page?: number,
    limit?: number
  ): Promise<WishlistResponse | null> {
    const wishlistId = await this.getWishlistId()
    if (!wishlistId) {
      return null
    }

    const wishlistService = this.getWishlistService()
    return await wishlistService.getWishlist(wishlistId, page, limit)
  }

  async addToWishlist(
    request: AddToWishlistRequest
  ): Promise<WishlistResponse> {
    const wishlistId = await this.getOrCreateWishlistId()
    const wishlistService = this.getWishlistService()
    return await wishlistService.addToWishlist(wishlistId, request)
  }

  async removeFromWishlist(
    request: RemoveFromWishlistRequest
  ): Promise<WishlistResponse> {
    const wishlistId = await this.getOrCreateWishlistId()
    const wishlistService = this.getWishlistService()
    return await wishlistService.removeFromWishlist(wishlistId, request)
  }

  /**
   * Fetches guest wishlist items in a format suitable for merging after login.
   * This should be called before authentication while the anonymous session is still active.
   * @returns Array of items with productId and variantId, or empty array if no wishlist or on error
   */
  async getGuestWishlistItemsForMerge(): Promise<
    Array<{ productId: string; variantId?: string }>
  > {
    try {
      const guestWishlist = await this.getWishlist()
      if (!guestWishlist) {
        return []
      }

      return guestWishlist.items.map((item) => ({
        productId: item.product.id,
        variantId: item.product.variantId,
      }))
    } catch (error) {
      this.logger.warn(
        `Failed to fetch guest wishlist items for merge: ${error}`
      )
      return []
    }
  }

  /**
   * Setup wishlist after user login.
   * Merges items from guest wishlist into the logged-in user's wishlist.
   * @param guestWishlistId - Optional guest wishlist ID to delete cookie
   * @param guestWishlistItems - Guest wishlist items to merge (fetched before login)
   */
  async setupWishlistAfterLogin(
    guestWishlistId?: string,
    guestWishlistItems?: Array<{ productId: string; variantId?: string }>
  ): Promise<void> {
    // Delete guest wishlist cookie
    if (guestWishlistId) {
      await this.wishlistIdService.deleteGuestWishlistId()
    }

    // Get or create the logged-in user's wishlist
    const wishlistService = this.getWishlistService()
    const wishlist = await wishlistService.getOrCreateWishlist()

    if (wishlist) {
      await this.wishlistIdService.setLoggedInWishlistId(wishlist.id)

      // Merge guest wishlist items into customer wishlist
      if (guestWishlistItems && guestWishlistItems.length > 0) {
        const existingProductIds = new Set(
          wishlist.items.map((item) => item.product.id)
        )

        // Add items from guest wishlist that don't already exist
        for (const item of guestWishlistItems) {
          if (!existingProductIds.has(item.productId)) {
            try {
              await this.addToWishlist({
                productId: item.productId,
                variantId: item.variantId,
              })
              this.logger.log(
                `Merged product ${item.productId} from guest wishlist to customer wishlist`
              )
            } catch (error) {
              this.logger.warn(
                `Failed to merge product ${item.productId} from guest wishlist: ${error}`
              )
            }
          }
        }
      }
    }
  }

  /**
   * Get wishlist ID from wishlist ID service, or create a new wishlist if none exists.
   * This method does not fetch the full wishlist, only gets/creates the wishlist ID.
   */
  private async getOrCreateWishlistId(): Promise<string> {
    const wishlistId = await this.getWishlistId()
    if (wishlistId) {
      return wishlistId
    }

    await this.ensureSession()

    const wishlistService = this.getWishlistService()
    const wishlist = await wishlistService.getOrCreateWishlist()

    await this.setWishlistId(wishlist.id)

    return wishlist.id
  }

  /**
   * Gets the current wishlist ID (logged-in or guest)
   * @returns Wishlist ID or undefined if none exists
   */
  private async getWishlistId(): Promise<string | undefined> {
    const isLoggedIn = await this.isLoggedIn()

    if (isLoggedIn) {
      const wishlistId = await this.wishlistIdService.getLoggedInWishlistId()
      if (wishlistId) {
        return wishlistId
      }
    }

    return await this.wishlistIdService.getGuestWishlistId()
  }

  /**
   * Sets the wishlist ID in the appropriate cookie based on login status
   */
  private async setWishlistId(wishlistId: string): Promise<void> {
    const isLoggedIn = await this.isLoggedIn()
    if (isLoggedIn) {
      await this.wishlistIdService.setLoggedInWishlistId(wishlistId)
    } else {
      await this.wishlistIdService.setGuestWishlistId(wishlistId)
    }
  }
}
