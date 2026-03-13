import { z } from 'zod'
import { ButtonEntryApiResponseSchema } from '../link'
import { ContentfulImageApiResponseSchema } from '../image'

export const TeaserHeroApiResponseSchema = z.object({
  __typename: z.literal('TeaserHero'),
  headline: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  cta: ButtonEntryApiResponseSchema.optional().nullable(),
  backgroundImage: ContentfulImageApiResponseSchema,
})

export type TeaserHeroApiResponse = z.infer<typeof TeaserHeroApiResponseSchema>
