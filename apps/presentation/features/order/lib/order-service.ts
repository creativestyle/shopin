import {
  OrderResponseSchema,
  CreateOrderRequestSchema,
  type OrderResponse,
  type CreateOrderRequest,
} from '@core/contracts/order/order'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for order operations.
 */
export class OrderService extends BaseService {
  /**
   * Create an order from a cart
   */
  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    const validatedRequest = CreateOrderRequestSchema.parse(request)
    const data = await this.post<OrderResponse>('/order', validatedRequest)
    return OrderResponseSchema.parse(data)
  }

  /**
   * Get an order by ID
   */
  async getOrder(orderId: string): Promise<OrderResponse> {
    const data = await this.get<OrderResponse>(`/order/${orderId}`)
    return OrderResponseSchema.parse(data)
  }
}
