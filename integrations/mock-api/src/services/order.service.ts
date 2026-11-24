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
  OrderSummaryResponse,
} from '@core/contracts/order/order'
import { cartOwnerStore, cartStore } from './cart.service'
import { MockSessionService } from '../session/mock-session.service'
import { getSessionCustomerId } from '../session/mock-session-store'

// Orders are looked up by their unguessable id
export const orderStore = new Map<string, OrderResponse>()
// Order id -> mock session that placed it, for the customer's order history
export const orderOwnerStore = new Map<string, string>()
// Cart id -> order id, so a repeated order answers 409 like commercetools
export const orderedCartStore = new Map<string, string>()

function toOrderSummary(order: OrderResponse): OrderSummaryResponse {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    orderState: order.orderState,
    grandTotal: order.grandTotal,
    currency: order.currency,
    itemCount: order.itemCount,
    deliveryTime: order.shippingInfo?.deliveryTime,
    lineItemImages: order.lineItems.flatMap((item) =>
      item.imageUrl ? [{ url: item.imageUrl, alt: item.name }] : []
    ),
  }
}

@Injectable()
export class OrderService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly sessionService: MockSessionService
  ) {
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
      // Same source as the commercetools order mapper
      email: cart.billingAddress?.email || cart.shippingAddress?.email,
    })

    const ownerSessionId = cartOwnerStore.get(request.cartId)
    if (ownerSessionId) {
      orderOwnerStore.set(order.id, ownerSessionId)
    }
    cartOwnerStore.delete(request.cartId)
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
    const offset = request?.offset ?? 0
    const limit = request?.limit ?? DEFAULT_ORDER_PAGE_SIZE
    const customerId = await this.sessionService.getCustomerId()
    const orders = customerId
      ? [...orderStore.values()]
          .filter(
            (order) =>
              getSessionCustomerId(orderOwnerStore.get(order.id)) === customerId
          )
          .reverse()
      : []

    return {
      orders: orders.slice(offset, offset + limit).map(toOrderSummary),
      total: orders.length,
      offset,
      limit,
    }
  }
}
