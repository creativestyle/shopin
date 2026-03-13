import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { MOCK_API, MockApi } from '../client/client.module'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
import type {
  WishlistResponse,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
  WishlistItemResponse,
} from '@core/contracts/wishlist/wishlist'
import { randomUUID } from 'crypto'
import { generateSeed } from '../helpers/generateSeed'
import { createShopinProductCardList } from '../generators'

// Simple in-memory store for mock wishlists
// Wishlist IDs can be stored in localStorage on the client side
export const wishlistStore = new Map<string, WishlistResponse>()

@Injectable()
export class WishlistService {
  constructor(
    @Inject(MOCK_API) private readonly mockApi: MockApi,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(WishlistService.name)
  }

  async getWishlist(
    wishlistId: string,
    page?: number,
    limit?: number
  ): Promise<WishlistResponse> {
    const wishlist = wishlistStore.get(wishlistId)
    if (!wishlist) {
      this.logger.warn({ wishlistId }, 'Wishlist not found')
      throw new NotFoundException(`Wishlist not found: ${wishlistId}`)
    }

    if (page !== undefined && limit !== undefined && limit > 0) {
      const offset = (page - 1) * limit
      const paginatedItems = wishlist.items.slice(offset, offset + limit)

      return {
        ...wishlist,
        items: paginatedItems,
      }
    }

    return wishlist
  }

  async getOrCreateWishlist(): Promise<WishlistResponse> {
    const wishlistId = `mock-wishlist-${randomUUID()}`
    const wishlist: WishlistResponse = {
      id: wishlistId,
      version: 1,
      items: [],
      itemCount: 0,
    }
    wishlistStore.set(wishlistId, wishlist)
    this.logger.info({ wishlistId }, 'Created new wishlist')
    return wishlist
  }

  async addToWishlist(
    wishlistId: string,
    request: AddToWishlistRequest
  ): Promise<WishlistResponse> {
    const wishlist = await this.getWishlist(wishlistId)
    const productId = request.productId!

    // Generate product data using faker with deterministic seed
    const faker = this.mockApi.getFaker()
    const seed = generateSeed(`product-${productId}`)
    faker.seed(seed)

    const currentLanguage = this.languageProvider.getCurrentLanguage()
    const currency = resolveCurrencyFromLanguage(currentLanguage)

    const [productCard] = createShopinProductCardList(faker, 1)
    const productWithCurrency = {
      ...productCard,
      id: productId, // Use the actual product ID from the request
      price: { ...productCard.price, currency },
    }

    const lineItemId = `wishlist-item-${randomUUID()}`
    const newItem: WishlistItemResponse = {
      id: lineItemId,
      product: productWithCurrency,
    }

    const updatedWishlist: WishlistResponse = {
      ...wishlist,
      version: wishlist.version + 1,
      items: [...wishlist.items, newItem],
      itemCount: wishlist.items.length + 1,
    }

    wishlistStore.set(wishlistId, updatedWishlist)
    this.logger.info({ wishlistId, productId, lineItemId }, 'Added to wishlist')
    return updatedWishlist
  }

  async removeFromWishlist(
    wishlistId: string,
    request: RemoveFromWishlistRequest
  ): Promise<WishlistResponse> {
    const wishlist = await this.getWishlist(wishlistId)
    const { lineItemId } = request

    const itemIndex = wishlist.items.findIndex((item) => item.id === lineItemId)

    if (itemIndex === -1) {
      this.logger.warn({ wishlistId, lineItemId }, 'Wishlist item not found')
      throw new NotFoundException(
        `Wishlist item not found: ${lineItemId} in wishlist ${wishlistId}`
      )
    }

    const updatedItems = wishlist.items.filter((item) => item.id !== lineItemId)

    const updatedWishlist: WishlistResponse = {
      ...wishlist,
      version: wishlist.version + 1,
      items: updatedItems,
      itemCount: updatedItems.length,
    }

    wishlistStore.set(wishlistId, updatedWishlist)
    this.logger.info({ wishlistId, lineItemId }, 'Removed item from wishlist')
    return updatedWishlist
  }
}
