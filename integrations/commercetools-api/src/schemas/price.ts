import { z } from 'zod'

export const TypedMoneyApiResponseSchema = z.object({
  centAmount: z.number(),
  currencyCode: z.string(),
  type: z.enum(['centPrecision', 'highPrecision']),
  fractionDigits: z.number(),
  preciseAmount: z.number().optional(),
})

export const DiscountedPriceApiResponseSchema = z.object({
  value: TypedMoneyApiResponseSchema,
  discount: z.object({
    typeId: z.literal('product-discount'),
    id: z.string(),
  }),
})

export const PriceApiResponseSchema = z.object({
  id: z.string(),
  value: TypedMoneyApiResponseSchema,
  country: z.string().optional(),
  discounted: DiscountedPriceApiResponseSchema.optional(),
  custom: z
    .object({
      fields: z.record(z.string(), z.unknown()),
    })
    .optional(),
})

export type PriceApiResponse = z.infer<typeof PriceApiResponseSchema>
