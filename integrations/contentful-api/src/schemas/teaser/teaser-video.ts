import { z } from 'zod'
import { ContentfulImageApiResponseSchema } from '../image'
import { LinkEntryApiResponseSchema } from '../link'

export const TeaserVideoApiResponseSchema = z.object({
  __typename: z.literal('TeaserVideo'),
  title: z.string().optional().nullable(),
  video: ContentfulImageApiResponseSchema,
  thumbnail: ContentfulImageApiResponseSchema.optional().nullable(),
  autoplay: z.boolean().optional().nullable(),
  controls: z.boolean().optional().nullable(),
  caption: z.string().optional().nullable(),
  link: LinkEntryApiResponseSchema.optional().nullable(),
})

export type TeaserVideoApiResponse = z.infer<
  typeof TeaserVideoApiResponseSchema
>
