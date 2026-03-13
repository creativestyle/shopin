import { z } from 'zod'
import { BasicPriceResponseSchema } from './basic-price'

export const DetailedPriceResponseSchema = BasicPriceResponseSchema.extend({
  regularUnitPriceInCents: z.number().optional(),
  discountedUnitPriceInCents: z.number().optional(),
  unit: z.string().optional(),
})

export type DetailedPriceResponse = z.infer<typeof DetailedPriceResponseSchema>
