import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { LANGUAGE_TOKEN } from '@core/i18n'
import type { LanguageProvider } from '@apps/bff/src/common/language/language.provider'
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
import { UserClientService } from '../client/user-client.service'
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

  // Minimal expansion for list view - just need first item image
  private static readonly ORDER_LIST_EXPAND = [
    'lineItems[*].variant',
  ] satisfies string[]

  // Default pagination limit for order list
  private static readonly ORDER_LIST_DEFAULT_LIMIT = DEFAULT_ORDER_PAGE_SIZE

  constructor(
    private readonly userClientService: UserClientService,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  private getCurrentLanguage(): string {
    return this.languageProvider.getCurrentLanguage()
  }

  private async getClient() {
    return this.userClientService.getClient()
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
    const client = await this.getClient()

    // Get cart directly from Commercetools to verify it exists and get its version
    const cartResponse = await client
      .me()
      .carts()
      .withId({ ID: request.cartId })
      .get({
        queryArgs: {
          expand: OrderService.ORDER_EXPAND,
        },
      })
      .execute()

    const cartVersion = cartResponse.body.version

    // Create order from cart with expansions
    try {
      const orderResponse = await client
        .me()
        .orders()
        .post({
          body: {
            id: request.cartId,
            version: cartVersion,
          },
          queryArgs: {
            expand: OrderService.ORDER_EXPAND,
          },
        })
        .execute()

      const currentLanguage = this.getCurrentLanguage()
      return this.processOrderResponse(orderResponse.body, currentLanguage)
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
    const client = await this.getClient()

    try {
      const orderResponse = await client
        .me()
        .orders()
        .withId({ ID: orderId })
        .get({
          queryArgs: {
            expand: OrderService.ORDER_EXPAND,
          },
        })
        .execute()

      return this.processOrderResponse(orderResponse.body, currentLanguage)
    } catch (error) {
      if (isNotFoundError(error)) {
        throw new NotFoundException(`Order not found: ${orderId}`)
      }
      throw error
    }
  }

  async getOrders(request?: GetOrdersRequest): Promise<OrdersResponse> {
    const currentLanguage = this.getCurrentLanguage()
    const client = await this.getClient()

    const limit = request?.limit ?? OrderService.ORDER_LIST_DEFAULT_LIMIT
    const offset = request?.offset ?? 0

    const ordersResponse = await client
      .me()
      .orders()
      .get({
        queryArgs: {
          expand: OrderService.ORDER_LIST_EXPAND,
          sort: ['createdAt desc'],
          limit,
          offset,
        },
      })
      .execute()

    const validatedResponse = OrdersListApiResponseSchema.parse(
      ordersResponse.body
    )
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
