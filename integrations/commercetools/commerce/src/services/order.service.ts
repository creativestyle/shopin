import { RequestContext } from '@core/integration-kit'
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import { DEFAULT_ORDER_PAGE_SIZE } from '@core/contracts/order/order'
import {
  OrderResponseSchema,
  OrdersResponseSchema,
} from '@core/contracts/order/order'
import { CustomerScope } from '../shared/customer-scope.service'
import { mapOrderToResponse, mapOrdersToResponse } from '../mappers/order'
import {
  OrderApiResponseSchema,
  OrdersListApiResponseSchema,
} from '../schemas/order'
import { isNotFoundError, isConflictError } from '../helpers/is-not-found-error'

@Injectable()
export class OrderService {
  private static readonly ORDER_EXPAND = [
    'lineItems[*].product',
    'lineItems[*].variant',
    'lineItems[*].product.productType',
    'paymentInfo.payments[*]',
  ] satisfies string[]

  // Order detail resolves the shipping method for its deliveryTime custom field
  private static readonly ORDER_DETAIL_EXPAND = [
    ...OrderService.ORDER_EXPAND,
    'shippingInfo.shippingMethod',
  ] satisfies string[]

  // Minimal expansion for list view - just need first item image
  private static readonly ORDER_LIST_EXPAND = [
    'lineItems[*].variant',
    'shippingInfo.shippingMethod',
  ] satisfies string[]

  // Default pagination limit for order list
  private static readonly ORDER_LIST_DEFAULT_LIMIT = DEFAULT_ORDER_PAGE_SIZE

  constructor(
    private readonly scope: CustomerScope,
    private readonly languageProvider: RequestContext
  ) {}

  private getCurrentLanguage(): string {
    return this.languageProvider.getCurrentLanguage()
  }

  private processOrderResponse(
    responseBody: unknown,
    currentLanguage: string
  ): OrderResponse {
    const validatedOrder = OrderApiResponseSchema.parse(responseBody)
    const mappedOrder = mapOrderToResponse(validatedOrder, currentLanguage)
    return OrderResponseSchema.parse(mappedOrder)
  }

  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    const api = await this.scope.api()

    // The shopper's cart (404 for anyone else's), for its version
    const cart = await api.carts.get(request.cartId, [])

    // Create order from cart with expansions
    try {
      const order = await api.orders.createFromCart(
        request.cartId,
        cart.version,
        OrderService.ORDER_EXPAND
      )

      const currentLanguage = this.getCurrentLanguage()
      return this.processOrderResponse(order, currentLanguage)
    } catch (error) {
      // If order creation fails with conflict error, order already exists
      if (isConflictError(error)) {
        throw new ConflictException('Order already exists for this cart')
      }
      throw error
    }
  }

  async getOrder(orderId: string): Promise<OrderResponse> {
    const currentLanguage = this.getCurrentLanguage()
    try {
      const order = await (
        await this.scope.api()
      ).orders.get(orderId, OrderService.ORDER_DETAIL_EXPAND)

      return this.processOrderResponse(order, currentLanguage)
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException(`Order not found: ${orderId}`)
      }
      throw error
    }
  }

  async getOrders(request?: GetOrdersRequest): Promise<OrdersResponse> {
    const currentLanguage = this.getCurrentLanguage()
    const limit = request?.limit ?? OrderService.ORDER_LIST_DEFAULT_LIMIT
    const offset = request?.offset ?? 0

    const orders = await (
      await this.scope.api()
    ).orders.query({
      expand: OrderService.ORDER_LIST_EXPAND,
      sort: ['createdAt desc'],
      limit,
      offset,
    })

    const validatedResponse = OrdersListApiResponseSchema.parse(orders)
    const mappedOrders = mapOrdersToResponse(
      validatedResponse,
      currentLanguage,
      {
        total: validatedResponse.total,
        offset: validatedResponse.offset,
        limit: validatedResponse.limit,
      }
    )
    return OrdersResponseSchema.parse(mappedOrders)
  }
}
