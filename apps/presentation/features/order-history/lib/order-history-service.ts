import type {
  OrdersResponse,
  OrderResponse,
  GetOrdersRequest,
} from '@core/contracts/order/order'
import { DEFAULT_ORDER_PAGE_SIZE } from '@core/contracts/order/order'
import { BaseService } from '@/lib/bff/services/base-service'

/**
 * Service for order history BFF operations.
 */
export class OrderHistoryService extends BaseService {
  /**
   * Get customer's order history with pagination
   * Returns empty orders array if not authenticated
   */
  async getOrders(params?: GetOrdersRequest): Promise<OrdersResponse> {
    const searchParams = new URLSearchParams()
    if (params?.limit !== undefined) {
      searchParams.set('limit', params.limit.toString())
    }
    if (params?.offset !== undefined) {
      searchParams.set('offset', params.offset.toString())
    }
    const query = searchParams.toString()
    const url = query ? `/order?${query}` : '/order'

    return await this.get<OrdersResponse>(url, {
      onError: (res) => {
        if (res.status === 401 || res.status === 403) {
          return {
            orders: [],
            total: 0,
            offset: 0,
            limit: DEFAULT_ORDER_PAGE_SIZE,
          }
        }
        throw new Error(
          `Failed to fetch orders: ${res.status} ${res.statusText}`
        )
      },
    })
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<OrderResponse | null> {
    return await this.get<OrderResponse | null>(`/order/${orderId}`, {
      allowEmpty: true,
      onError: (res) => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          return null
        }
        throw new Error(
          `Failed to fetch order: ${res.status} ${res.statusText}`
        )
      },
    })
  }
}
