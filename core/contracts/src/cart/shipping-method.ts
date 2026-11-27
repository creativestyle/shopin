import { z } from 'zod'

import { BasicPriceResponseSchema } from '../core/basic-price'

/** A shipping method's price: the shared price type (in cents, with its currency). */
export const ShippingMethodPriceSchema = BasicPriceResponseSchema

export type ShippingMethodPrice = z.infer<typeof ShippingMethodPriceSchema>

/**
 * Shipping method response schema
 *
 * `name`, `description` and `deliveryTime` are already resolved to the request's language.
 */
export const ShippingMethodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  deliveryTime: z.string().optional(),
  price: ShippingMethodPriceSchema,
  freeAbove: ShippingMethodPriceSchema.optional(),
  isDefault: z.boolean().optional(),
})

export type ShippingMethodResponse = z.infer<
  typeof ShippingMethodResponseSchema
>

/**
 * Shipping methods response schema
 */
export const ShippingMethodsResponseSchema = z.object({
  shippingMethods: z.array(ShippingMethodResponseSchema),
})

export type ShippingMethodsResponse = z.infer<
  typeof ShippingMethodsResponseSchema
>

/**
 * Set shipping method request schema
 */
export const SetShippingMethodRequestSchema = z.object({
  shippingMethodId: z.string(),
})

export type SetShippingMethodRequest = z.infer<
  typeof SetShippingMethodRequestSchema
>
