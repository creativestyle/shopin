import {
  type OrderResponse,
  type OrderSummaryResponse,
  type OrdersResponse,
  type OrderState,
  OrderStateSchema,
} from '@core/contracts/order/order'
import type { OrderApiResponse, OrdersListApiResponse } from '../schemas/order'
import { mapCartToResponse } from './cart'
import { getLocalizedString } from '../helpers/get-localized-string'
import type { LocalizedStringApiResponse } from '../schemas/localized-string'
import { createBasicPrice } from '../helpers/create-basic-price'

/**
 * Derives a composite display status from Commercetools orderState + shipmentState.
 *
 * Commercetools splits order lifecycle into separate fields:
 *  - orderState:    Open | Confirmed | Complete | Cancelled
 *  - shipmentState: Shipped | Delivered | Ready | Pending | Delayed | Partial | Backorder
 *
 * We combine them into a single OrderState for display purposes.
 */
function deriveOrderState(
  orderState: string | undefined,
  shipmentState: string | undefined
): OrderState {
  if (orderState === 'Cancelled') {
    return OrderStateSchema.enum.Cancelled
  }

  if (orderState === 'Complete') {
    return OrderStateSchema.enum.Complete
  }

  if (shipmentState === 'Delivered') {
    return OrderStateSchema.enum.Delivered
  }

  if (shipmentState === 'Shipped') {
    return OrderStateSchema.enum.Shipped
  }

  if (orderState === 'Confirmed') {
    return OrderStateSchema.enum.Processing
  }

  return OrderStateSchema.enum.Open
}

/**
 * Maps Commercetools order (which has the same structure as cart) to OrderResponse
 * Reuses mapCartToResponse and adds order-specific fields
 */
export function mapOrderToResponse(
  order: OrderApiResponse,
  language: string
): OrderResponse {
  // Reuse cart mapper to get all the common fields (including shippingInfo)
  const cartResponse = mapCartToResponse(order, language)

  // Use orderNumber if provided, otherwise fall back to id
  const orderNumber = order.orderNumber || order.id

  // Extract email from billing address (or shipping address as fallback)
  const email =
    order.billingAddress?.email || order.shippingAddress?.email || undefined

  // Convert CartResponse to OrderResponse by adding order-specific fields
  return {
    ...cartResponse,
    orderNumber,
    createdAt: order.createdAt,
    orderState: deriveOrderState(order.orderState, order.shipmentState),
    email,
  }
}

/**
 * Maps Commercetools order to lightweight summary for list view
 */
export function mapOrderToSummary(
  order: OrderApiResponse,
  language: string
): OrderSummaryResponse {
  const orderNumber = order.orderNumber || order.id
  const currency = order.currency || order.totalPrice.currencyCode
  const grandTotalCents =
    order.taxedPrice?.totalGross.centAmount ?? order.totalPrice.centAmount

  // Calculate item count directly from raw line items
  const itemCount = (order.lineItems ?? []).reduce(
    (sum, li) => sum + li.quantity,
    0
  )

  // Collect one image per line item for preview
  const lineItemImages = (order.lineItems ?? [])
    .map((li) => {
      const image = li.variant?.images?.[0]

      if (!image) {
        return null
      }

      return {
        url: image.url,
        alt:
          getLocalizedString(
            li.name as LocalizedStringApiResponse | undefined,
            language
          ) || undefined,
      }
    })
    .filter(
      (img): img is { url: string; alt: string | undefined } => img !== null
    )

  return {
    id: order.id,
    orderNumber,
    createdAt: order.createdAt,
    orderState: deriveOrderState(order.orderState, order.shipmentState),
    grandTotal: createBasicPrice(grandTotalCents, { currency })!,
    currency,
    itemCount,
    lineItemImages,
  }
}

/**
 * Maps Commercetools orders list to OrdersResponse
 */
export function mapOrdersToResponse(
  ordersListResponse: OrdersListApiResponse,
  language: string,
  pagination: { total: number; offset: number; limit: number }
): OrdersResponse {
  return {
    orders: ordersListResponse.results.map((order) =>
      mapOrderToSummary(order, language)
    ),
    total: pagination.total,
    offset: pagination.offset,
    limit: pagination.limit,
  }
}
