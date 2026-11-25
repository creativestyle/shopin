import { z } from 'zod'
import { ButtonEntryApiResponseSchema } from '../link'

export const TeaserHeadlineApiResponseSchema = z.object({
  __typename: z.literal('TeaserHeadline'),
  headline: z.string().optional().nullable(),
  subtext: z.string().optional().nullable(),
  cta: ButtonEntryApiResponseSchema.optional().nullable(),
})

export type TeaserHeadlineApiResponse = z.infer<
  typeof TeaserHeadlineApiResponseSchema
>
