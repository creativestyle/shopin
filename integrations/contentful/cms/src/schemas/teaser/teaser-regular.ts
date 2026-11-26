import { z } from 'zod'
import { ButtonEntryApiResponseSchema } from '../link'
import { ContentfulImageApiResponseSchema } from '../image'

export const TeaserRegularApiResponseSchema = z.object({
  __typename: z.literal('TeaserRegular'),
  categoryLabel: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  cta: ButtonEntryApiResponseSchema.optional().nullable(),
  image: ContentfulImageApiResponseSchema,
})

export type TeaserRegularApiResponse = z.infer<
  typeof TeaserRegularApiResponseSchema
>
