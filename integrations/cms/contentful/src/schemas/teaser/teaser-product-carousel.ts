import { z } from 'zod'

export const TeaserProductCarouselApiResponseSchema = z.object({
  __typename: z.literal('TeaserProductCarousel'),
  title: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
})

export type TeaserProductCarouselApiResponse = z.infer<
  typeof TeaserProductCarouselApiResponseSchema
>
