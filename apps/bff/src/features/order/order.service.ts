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

      // Clear the cart ID cookie after successful order creation
      // The cart has been converted to an order and becomes immutable
      // We don't need to clear cart items - the cart no longer exists as a cart
      // We only need to remove the cart ID from cookies so the system knows there's no active cart
      const isLoggedIn = (await this.tokenProvider.getAuthStatus()) === true
      if (isLoggedIn) {
        await this.cartIdService.deleteLoggedInCartId()
      } else {
        await this.cartIdService.deleteGuestCartId()
        // the guest may read this order (its confirmation page), and no other
        await this.session.setGuestOrder(order.id)
      }

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
