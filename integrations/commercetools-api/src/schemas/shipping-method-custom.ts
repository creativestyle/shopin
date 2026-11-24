import { z } from 'zod'
import { LocalizedStringApiResponseSchema } from './localized-string'

/** Field on the `shipping-method` custom Type holding the delivery estimate */
export const SHIPPING_METHOD_DELIVERY_TIME_FIELD = 'deliveryTime'

// Display-only data: a field of another type is dropped instead of failing the parse
export const ShippingMethodCustomApiResponseSchema = z
  .object({
    fields: z
      .object({
        [SHIPPING_METHOD_DELIVERY_TIME_FIELD]:
          LocalizedStringApiResponseSchema.optional().catch(undefined),
      })
      .optional(),
  })
  .optional()
  .catch(undefined)

export type ShippingMethodCustomApiResponse = z.infer<
  typeof ShippingMethodCustomApiResponseSchema
>
