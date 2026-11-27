import { Injectable, Scope } from '@nestjs/common'
import { SessionService } from '../../common/session/session.service'

/** Cart ids of this request's commerce provider, kept by the core session. */
@Injectable({ scope: Scope.REQUEST })
export class CartIdService {
  constructor(private readonly session: SessionService) {}

  async getLoggedInCartId(): Promise<string | undefined> {
    return await this.session.getCartId(false)
  }
  async getGuestCartId(): Promise<string | undefined> {
    return await this.session.getCartId(true)
  }
  async hasLoggedInCartId(): Promise<boolean> {
    return !!(await this.session.getCartId(false))
  }
  async hasGuestCartId(): Promise<boolean> {
    return !!(await this.session.getCartId(true))
  }
  async setLoggedInCartId(cartId: string): Promise<void> {
    await this.session.setCartId(false, cartId)
  }
  async setGuestCartId(cartId: string): Promise<void> {
    await this.session.setCartId(true, cartId)
  }
  async deleteLoggedInCartId(): Promise<void> {
    this.session.deleteCartId(false)
  }
  async deleteGuestCartId(): Promise<void> {
    this.session.deleteCartId(true)
  }
  /** This commerce provider's carts only; the other provider's session is untouched. */
  async deleteAllCartIds(): Promise<void> {
    this.session.deleteAllCartIds()
  }
}
