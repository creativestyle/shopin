import { z } from 'zod'
import { BasicPriceResponseSchema } from '../core/basic-price'
import {
  LineItemResponseSchema,
  ShippingInfoResponseSchema,
  PaymentInfoResponseSchema,
} from '../cart/cart'
import { AddressBaseSchema } from '../address/address-base'

export const DEFAULT_ORDER_PAGE_SIZE = 20

export const OrderStateSchema = z.enum([
  'Open',
  'Confirmed',
  'Processing',
  'Shipped',
  'Complete',
  'Delivered',
  'Cancelled',
])

export type OrderState = z.infer<typeof OrderStateSchema>

/**
 * Create order request schema
 */
export const CreateOrderRequestSchema = z.object({
  cartId: z.string(),
})

export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>

/**
 * Order response schema - includes full order details
 */
export const OrderResponseSchema = z.object({
  id: z.string(),
  version: z.number(),
  orderNumber: z.string(),
  createdAt: z.string(),
  orderState: OrderStateSchema,
  lineItems: z.array(LineItemResponseSchema),
  subtotal: BasicPriceResponseSchema,
  tax: BasicPriceResponseSchema.optional(),
  discountAmount: BasicPriceResponseSchema.optional(),
  grandTotal: BasicPriceResponseSchema,
  currency: z.string(),
  itemCount: z.number().int().nonnegative(),
  email: z.string().optional(),
  billingAddress: AddressBaseSchema.optional(),
  shippingAddress: AddressBaseSchema.optional(),
  shippingInfo: ShippingInfoResponseSchema,
  paymentInfo: PaymentInfoResponseSchema,
})

export type OrderResponse = z.infer<typeof OrderResponseSchema>

/**
 * Order summary schema - lightweight version for list view
 */
export const OrderSummaryResponseSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  createdAt: z.string(),
  orderState: OrderStateSchema,
  grandTotal: BasicPriceResponseSchema,
  currency: z.string(),
  itemCount: z.number().int().nonnegative(),
  lineItemImages: z.array(
    z.object({
      url: z.string(),
      alt: z.string().optional(),
    })
  ),
})

export type OrderSummaryResponse = z.infer<typeof OrderSummaryResponseSchema>

/**
 * Get orders request schema - pagination parameters
 */
export const GetOrdersRequestSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
})

export type GetOrdersRequest = z.infer<typeof GetOrdersRequestSchema>

/**
 * Orders list response schema - includes pagination info
 */
export const OrdersResponseSchema = z.object({
  orders: z.array(OrderSummaryResponseSchema),
  total: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
})

export type OrdersResponse = z.infer<typeof OrdersResponseSchema>
