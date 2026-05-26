import { z } from 'zod'

export const StoreConfigResponseSchema = z.object({
  shippingCountries: z.array(z.string().length(2)),
  projectCountries: z.array(z.string().length(2)),
})

export type StoreConfigResponse = z.infer<typeof StoreConfigResponseSchema>
