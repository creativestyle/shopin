import { z } from 'zod'

export const TeaserTextApiResponseSchema = z.object({
  __typename: z.literal('TeaserText'),
  body: z.string().optional().nullable(),
})

export type TeaserTextApiResponse = z.infer<typeof TeaserTextApiResponseSchema>
