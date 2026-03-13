import { z } from 'zod'

/**
 * Shipping method price schema
 */
export const ShippingMethodPriceSchema = z.object({
  centAmount: z.number(),
  currencyCode: z.string(),
})

export type ShippingMethodPrice = z.infer<typeof ShippingMethodPriceSchema>

/**
 * Shipping method response schema
 */
export const ShippingMethodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  localizedDescription: z.record(z.string(), z.string()).optional(),
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
