import { Injectable, ConflictException } from '@nestjs/common'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { CartIdService } from '../cart-id/cart-id.service'
import { TokenProvider } from '../../common/token-management/token-provider'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSourceFactory: DataSourceFactory,
    private readonly cartIdService: CartIdService,
    private readonly tokenProvider: TokenProvider
  ) {}

  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    const { orderService } = this.dataSourceFactory.getServices()

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

  async getOrder(orderId: string): Promise<OrderResponse> {
    const { orderService } = this.dataSourceFactory.getServices()
    return await orderService.getOrder(orderId)
  }

  async getOrders(request?: GetOrdersRequest): Promise<OrdersResponse> {
    const { orderService } = this.dataSourceFactory.getServices()
    return await orderService.getOrders(request)
  }
}
