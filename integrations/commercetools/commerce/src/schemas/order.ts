import { z } from 'zod'
import { CartApiResponseSchema } from './cart'

/**
 * Order API response schema - extends CartApiResponseSchema with order-specific fields
 */
export const OrderApiResponseSchema = CartApiResponseSchema.extend({
  orderNumber: z.string().optional(),
  createdAt: z.string(),
  orderState: z.string().optional(),
  shipmentState: z.string().optional(),
  paymentState: z.string().optional(),
})

export type OrderApiResponse = z.infer<typeof OrderApiResponseSchema>

/**
 * Orders list API response schema - Commercetools paged query response
 */
export const OrdersListApiResponseSchema = z.object({
  results: z.array(OrderApiResponseSchema),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
})

export type OrdersListApiResponse = z.infer<typeof OrdersListApiResponseSchema>
