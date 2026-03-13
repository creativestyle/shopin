import { z } from 'zod'

export const StoreConfigApiResponseSchema = z.object({
  countries: z.array(z.string()),
})

export type StoreConfigApiResponse = z.infer<
  typeof StoreConfigApiResponseSchema
>
