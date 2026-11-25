import { z } from 'zod'
import { TeaserCarouselItemApiResponseSchema } from './teaser-carousel'

export const TeaserSliderApiResponseSchema = z.object({
  __typename: z.literal('TeaserSlider'),
  title: z.string().optional().nullable(),
  slidesCollection: z
    .object({
      items: z.array(TeaserCarouselItemApiResponseSchema),
    })
    .optional()
    .nullable(),
})

export type TeaserSliderApiResponse = z.infer<
  typeof TeaserSliderApiResponseSchema
>
