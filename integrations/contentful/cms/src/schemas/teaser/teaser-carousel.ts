import { z } from 'zod'
import {
  LinkEntryApiResponseSchema,
  ButtonEntryApiResponseSchema,
} from '../link'
import { ContentfulImageApiResponseSchema } from '../image'

/** Carousel/slider item from Contentful (teaserCarouselItem). */
export const TeaserCarouselItemApiResponseSchema = z.object({
  image: ContentfulImageApiResponseSchema,
  caption: z.string().optional().nullable(),
  link: LinkEntryApiResponseSchema.optional().nullable(),
  headline: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  cta: ButtonEntryApiResponseSchema.optional().nullable(),
})

export const TeaserCarouselApiResponseSchema = z.object({
  __typename: z.literal('TeaserCarousel'),
  title: z.string().optional().nullable(),
  carouselItemsCollection: z
    .object({
      items: z.array(TeaserCarouselItemApiResponseSchema),
    })
    .optional()
    .nullable(),
})

export type TeaserCarouselApiResponse = z.infer<
  typeof TeaserCarouselApiResponseSchema
>
