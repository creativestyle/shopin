import {
  OrderResponseSchema,
  type OrderResponse,
} from '@core/contracts/order/order'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for order operations.
 */
export class OrderService extends BaseService {
  /**
   * Get an order by ID
   */
  async getOrder(orderId: string): Promise<OrderResponse> {
    const data = await this.get<OrderResponse>(`/order/${orderId}`)
    return OrderResponseSchema.parse(data)
  }
}
