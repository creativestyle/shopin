import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { randomUUID } from 'crypto'
import {
  DEFAULT_ORDER_PAGE_SIZE,
  OrderResponseSchema,
} from '@core/contracts/order/order'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import { cartStore } from './cart.service'

// Orders are looked up by their unguessable id; mock has no customer-bound history
export const orderStore = new Map<string, OrderResponse>()
// Cart id -> order id, so a repeated order answers 409 like commercetools
export const orderedCartStore = new Map<string, string>()

@Injectable()
export class OrderService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(OrderService.name)
  }

  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    if (orderedCartStore.has(request.cartId)) {
      throw new ConflictException('Order already exists for this cart')
    }

    const cart = cartStore.get(request.cartId)
    if (!cart) {
      throw new NotFoundException(`Cart not found: ${request.cartId}`)
    }

    const order = OrderResponseSchema.parse({
      ...cart,
      id: `mock-order-${randomUUID()}`,
      version: 1,
      orderNumber: String(Date.now()),
      createdAt: new Date().toISOString(),
      orderState: 'Open',
    })

    cartStore.delete(request.cartId)
    orderStore.set(order.id, order)
    orderedCartStore.set(request.cartId, order.id)
    this.logger.info({ orderId: order.id }, 'Order created')

    return order
  }

  async getOrder(orderId: string): Promise<OrderResponse> {
    const order = orderStore.get(orderId)
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`)
    }
    return order
  }

  async getOrders(request?: GetOrdersRequest): Promise<OrdersResponse> {
    return {
      orders: [],
      total: 0,
      offset: request?.offset ?? 0,
      limit: request?.limit ?? DEFAULT_ORDER_PAGE_SIZE,
    }
  }
}
