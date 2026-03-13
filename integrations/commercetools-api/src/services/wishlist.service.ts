import { Injectable, Inject, Scope } from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type {
  WishlistResponse,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
} from '@core/contracts/wishlist/wishlist'
import { UserClientService } from '../client/user-client.service'
import { mapShoppingListToWishlist } from '../mappers/wishlist'

@Injectable({ scope: Scope.REQUEST })
export class WishlistService {
  private static readonly DEFAULT_WISHLIST_NAME = 'Wishlist'

  constructor(
    private readonly userClientService: UserClientService,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  private async getCurrentLanguage(): Promise<string> {
    return this.languageProvider.getCurrentLanguage()
  }

  private async getClient() {
    return this.userClientService.getClient()
  }

  async getWishlist(
    wishlistId: string,
    page?: number,
    limit?: number
  ): Promise<WishlistResponse> {
    const currentLanguage = await this.getCurrentLanguage()
    const client = await this.getClient()

    const response = await client
      .me()
      .shoppingLists()
      .withId({ ID: wishlistId })
      .get({
        queryArgs: {
          expand: ['lineItems[*].variant'],
        },
      })
      .execute()

    const fullWishlist = await mapShoppingListToWishlist(
      response.body,
      currentLanguage,
      client
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

    // Try to find existing wishlist
    const existingResponse = await client
      .me()
      .shoppingLists()
      .get({
        queryArgs: {
          limit: 1,
          expand: ['lineItems[*].variant'],
        },
      })
      .execute()

    if (existingResponse.body.results.length > 0) {
      return await mapShoppingListToWishlist(
        existingResponse.body.results[0],
        currentLanguage,
        client
      )
    }

    // Create new wishlist if none exists
    const createResponse = await client
      .me()
      .shoppingLists()
      .post({
        body: {
          name: {
            [currentLanguage]: WishlistService.DEFAULT_WISHLIST_NAME,
          },
        },
      })
      .execute()

    return await mapShoppingListToWishlist(
      createResponse.body,
      currentLanguage,
      client
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

    const response = await client
      .me()
      .shoppingLists()
      .withId({ ID: wishlistId })
      .post({
        body: {
          version: wishlist.version,
          actions: [
            {
              action: 'addLineItem',
              productId: request.productId!,
              variantId: request.variantId
                ? parseInt(request.variantId, 10)
                : undefined,
              quantity: 1,
            },
          ],
        },
        queryArgs: {
          expand: ['lineItems[*].variant'],
        },
      })
      .execute()

    return await mapShoppingListToWishlist(
      response.body,
      currentLanguage,
      client
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

    const response = await client
      .me()
      .shoppingLists()
      .withId({ ID: wishlistId })
      .post({
        body: {
          version: wishlist.version,
          actions: [
            {
              action: 'removeLineItem',
              lineItemId: request.lineItemId,
            },
          ],
        },
        queryArgs: {
          expand: ['lineItems[*].variant'],
        },
      })
      .execute()

    return await mapShoppingListToWishlist(
      response.body,
      currentLanguage,
      client
    )
  }
}
