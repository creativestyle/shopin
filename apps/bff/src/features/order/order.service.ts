import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { Services } from '../../data-source/ports.module'
import { CartIdService } from '../cart-id/cart-id.service'
import { SessionService } from '../../common/session/session.service'
import { TokenProvider } from '../../common/token-management/token-provider'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import { DEFAULT_ORDER_PAGE_SIZE } from '@core/contracts/order/order'

@Injectable()
export class OrderService {
  constructor(
    private readonly services: Services,
    private readonly cartIdService: CartIdService,
    private readonly tokenProvider: TokenProvider,
    private readonly session: SessionService
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    // Only the caller's own cart can be ordered; same 404 as an unknown cart
    if ((await this.getOwnCartId()) !== request.cartId) {
      throw new NotFoundException(`Cart not found: ${request.cartId}`)
    }

    const { orderService } = this.services

    try {
      // Create order using the data source order service
      const order = await orderService.createOrder(request)
      await this.cartBecameOrder(order.id)
      return order
    } catch (error) {
      // If order already exists (conflict), clear the cart ID before re-throwing
      // The cart ID is stale since the cart was already converted to an order
      if (error instanceof ConflictException) {
        const isLoggedIn = (await this.tokenProvider.getAuthStatus()) === true
        if (isLoggedIn) {
          await this.cartIdService.deleteLoggedInCartId()
        } else {
          await this.cartIdService.deleteGuestCartId()
        }
      }
      throw error
    }
  }

  /**
   * The cart has been converted to an order and becomes immutable: its id cookie is cleared, so the system knows there
   * is no active cart, and a guest may read this order (its confirmation page), and no other.
   */
  private async cartBecameOrder(orderId: string): Promise<void> {
    const isLoggedIn = (await this.tokenProvider.getAuthStatus()) === true
    if (isLoggedIn) {
      await this.cartIdService.deleteLoggedInCartId()
    } else {
      await this.cartIdService.deleteGuestCartId()
      await this.session.setGuestOrder(orderId)
    }
  }

  /**
   * The order already made from `cartId` that this shopper may read; undefined otherwise. Commerce is the record, not a
   * cookie of the answer that placed it (that answer may never have arrived). A customer's: the commerce port finds
   * only that customer's orders. A guest's, by the guest rule of `getOrder`: only for the cart this browser still holds
   * (a Retry after a lost answer) or the order this browser placed (a reload after the answer arrived); a guest with
   * neither does not ask the port. Found through a cart cookie that still names the ordered cart, what `createOrder`
   * did in the lost answer is done again (the cart cookie cleared, a guest's order readable).
   */
  async placedOrderOf(cartId: string): Promise<OrderResponse | undefined> {
    const isLoggedIn = (await this.tokenProvider.getAuthStatus()) === true
    const holdsCart = (await this.getOwnCartId()) === cartId
    const guestOrder = isLoggedIn ? undefined : await this.session.guestOrder()
    if (!isLoggedIn && !holdsCart && guestOrder === undefined) {
      return undefined
    }
    const order = await this.services.orderService.findOrderByCart(cartId)
    if (!order || (!isLoggedIn && !holdsCart && order.id !== guestOrder)) {
      return undefined
    }
    if (holdsCart) {
      await this.cartBecameOrder(order.id)
    }
    return order
  }

  /** The shopper's own cart id (the sealed cookie), the cart a payment must have been started for. */
  async ownCartId(): Promise<string | undefined> {
    return this.getOwnCartId()
  }

  private async getOwnCartId(): Promise<string | undefined> {
    const isLoggedIn = (await this.tokenProvider.getAuthStatus()) === true
    return isLoggedIn
      ? await this.cartIdService.getLoggedInCartId()
      : await this.cartIdService.getGuestCartId()
  }

  /**
   * One order. A customer's: the commerce port returns only that customer's orders (its contract). A guest's:
   * only the order this browser placed (the guest order cookie), checked here before the port is asked, so a
   * platform that keeps guest orders together (the mock) never hands one guest another's order.
   */
  async getOrder(orderId: string): Promise<OrderResponse> {
    const isLoggedIn = (await this.tokenProvider.getAuthStatus()) === true
    if (!isLoggedIn && (await this.session.guestOrder()) !== orderId) {
      throw new NotFoundException('Order not found')
    }
    const { orderService } = this.services
    return await orderService.getOrder(orderId)
  }

  /** The account's order list (the commerce port returns only this shopper's orders). */
  async getOrders(request?: GetOrdersRequest): Promise<OrdersResponse> {
    return await this.services.orderService.getOrders({
      offset: request?.offset ?? 0,
      limit: request?.limit ?? DEFAULT_ORDER_PAGE_SIZE,
    })
  }
}
