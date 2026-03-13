import { z } from 'zod'
import { LinkEntryApiResponseSchema } from '../link'
import { ContentfulImageApiResponseSchema } from '../image'

export const TeaserImageApiResponseSchema = z.object({
  __typename: z.literal('TeaserImage'),
  title: z.string().optional().nullable(),
  image: ContentfulImageApiResponseSchema,
  caption: z.string().optional().nullable(),
  link: LinkEntryApiResponseSchema.optional().nullable(),
})

export type TeaserImageApiResponse = z.infer<
  typeof TeaserImageApiResponseSchema
>
