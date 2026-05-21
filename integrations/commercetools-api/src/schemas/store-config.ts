import { z } from 'zod'

export const CommercetoolsStoreApiResponseSchema = z.object({
  countries: z.array(z.object({ code: z.string().length(2) })).optional(),
})

export type CommercetoolsStoreApiResponse = z.infer<
  typeof CommercetoolsStoreApiResponseSchema
>
