import { z } from 'zod'

export const CommercetoolsStoreApiResponseSchema = z.object({
  countries: z.array(z.object({ code: z.string().length(2) })).optional(),
  // Store.distributionChannels: ChannelReference[] (the channel's id)
  distributionChannels: z.array(z.object({ id: z.string() })).optional(),
})

export type CommercetoolsStoreApiResponse = z.infer<
  typeof CommercetoolsStoreApiResponseSchema
>
