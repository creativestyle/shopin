import { Injectable, Scope } from '@nestjs/common'
import { SessionService } from '../../common/session/session.service'

/** Wishlist ids of this request's commerce provider, kept by the core session. */
@Injectable({ scope: Scope.REQUEST })
export class WishlistIdService {
  constructor(private readonly session: SessionService) {}

  async getLoggedInWishlistId(): Promise<string | undefined> {
    return await this.session.getWishlistId(false)
  }
  async getGuestWishlistId(): Promise<string | undefined> {
    return await this.session.getWishlistId(true)
  }
  async setLoggedInWishlistId(wishlistId: string): Promise<void> {
    await this.session.setWishlistId(false, wishlistId)
  }
  async setGuestWishlistId(wishlistId: string): Promise<void> {
    await this.session.setWishlistId(true, wishlistId)
  }
  async deleteLoggedInWishlistId(): Promise<void> {
    this.session.deleteWishlistId(false)
  }
  async deleteGuestWishlistId(): Promise<void> {
    this.session.deleteWishlistId(true)
  }
  async deleteAllWishlistIds(): Promise<void> {
    this.session.deleteAllWishlistIds()
  }
}
