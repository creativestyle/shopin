import { RequestContext } from '@core/integration-kit'
import { Injectable, Optional } from '@nestjs/common'
import { MapperHooks } from '../mapper-hooks'
import type {
  WishlistResponse,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
} from '@core/contracts/wishlist/wishlist'
import { CustomerScope } from '../shared/customer-scope.service'
import { mapShoppingListToWishlist } from '../mappers/wishlist'

@Injectable()
export class WishlistService {
  private static readonly DEFAULT_WISHLIST_NAME = 'Wishlist'

  constructor(
    private readonly scope: CustomerScope,
    private readonly languageProvider: RequestContext,
    @Optional() private readonly hooks?: MapperHooks
  ) {}

  private async getCurrentLanguage(): Promise<string> {
    return this.languageProvider.getCurrentLanguage()
  }

  /** Client for the catalog lookups of the wishlist mapper. */
  private async getClient() {
    return this.scope.client()
  }

  async getWishlist(
    wishlistId: string,
    page?: number,
    limit?: number
  ): Promise<WishlistResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    // 404 for a wishlist that is not this shopper's
    const list = await (
      await this.scope.api()
    ).shoppingLists.get(wishlistId, ['lineItems[*].variant'])

    const fullWishlist = await mapShoppingListToWishlist(
      list,
      currentLanguage,
      client,
      this.hooks?.productCard
    )

    if (page !== undefined && limit !== undefined && limit > 0) {
      const offset = (page - 1) * limit
      const paginatedItems = fullWishlist.items.slice(offset, offset + limit)

      return {
        ...fullWishlist,
        items: paginatedItems,
      }
    }

    return fullWishlist
  }

  async getOrCreateWishlist(): Promise<WishlistResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    const api = await this.scope.api()

    // Try to find existing wishlist
    const existing = await api.shoppingLists.query({
      limit: 1,
      expand: ['lineItems[*].variant'],
    })

    if (existing.results.length > 0) {
      return await mapShoppingListToWishlist(
        existing.results[0]!,
        currentLanguage,
        client,
        this.hooks?.productCard
      )
    }

    // Create new wishlist if none exists
    const created = await api.shoppingLists.create({
      name: {
        [currentLanguage]: WishlistService.DEFAULT_WISHLIST_NAME,
      },
    })

    return await mapShoppingListToWishlist(
      created,
      currentLanguage,
      client,
      this.hooks?.productCard
    )
  }

  async addToWishlist(
    wishlistId: string,
    request: AddToWishlistRequest
  ): Promise<WishlistResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    // Get current version
    const wishlist = await this.getWishlist(wishlistId)

    const updated = await (
      await this.scope.api()
    ).shoppingLists.update(
      wishlistId,
      wishlist.version,
      [
        {
          action: 'addLineItem',
          productId: request.productId!,
          variantId: request.variantId
            ? parseInt(request.variantId, 10)
            : undefined,
          quantity: 1,
        },
      ],
      ['lineItems[*].variant']
    )

    return await mapShoppingListToWishlist(
      updated,
      currentLanguage,
      client,
      this.hooks?.productCard
    )
  }

  async removeFromWishlist(
    wishlistId: string,
    request: RemoveFromWishlistRequest
  ): Promise<WishlistResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    // Get current version
    const wishlist = await this.getWishlist(wishlistId)

    const updated = await (
      await this.scope.api()
    ).shoppingLists.update(
      wishlistId,
      wishlist.version,
      [
        {
          action: 'removeLineItem',
          lineItemId: request.lineItemId,
        },
      ],
      ['lineItems[*].variant']
    )

    return await mapShoppingListToWishlist(
      updated,
      currentLanguage,
      client,
      this.hooks?.productCard
    )
  }
}
