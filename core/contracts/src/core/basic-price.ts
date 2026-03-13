import { z } from 'zod'

export const BasicPriceResponseSchema = z.object({
  regularPriceInCents: z.number(),
  discountedPriceInCents: z.number().optional(),
  currency: z.string().optional(),
  fractionDigits: z.number().optional(),
  recommendedRetailPriceInCents: z.number().optional(),
  omnibusPriceInCents: z.number().optional(),
})

export type BasicPriceResponse = z.infer<typeof BasicPriceResponseSchema>
