import { z } from 'zod'

export const StoreConfigResponseSchema = z.object({
  countries: z.array(z.string().length(2)),
})

export type StoreConfigResponse = z.infer<typeof StoreConfigResponseSchema>
