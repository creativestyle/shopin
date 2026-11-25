import { z } from 'zod'
import { ButtonEntryApiResponseSchema } from '../link'
import { ContentfulImageApiResponseSchema } from '../image'

export const TeaserBannerApiResponseSchema = z.object({
  __typename: z.literal('TeaserBanner'),
  headline: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  cta: ButtonEntryApiResponseSchema.optional().nullable(),
  backgroundImage: ContentfulImageApiResponseSchema,
})

export type TeaserBannerApiResponse = z.infer<
  typeof TeaserBannerApiResponseSchema
>
