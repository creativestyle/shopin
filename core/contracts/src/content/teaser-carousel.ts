import { z } from 'zod'
import { TeaserCarouselItemSchema } from './teaser-carousel-item'

export const CarouselTeaserSchema = z.object({
  type: z.literal('carousel'),
  title: z.string().optional(),
  items: z.array(TeaserCarouselItemSchema),
})
export type CarouselTeaser = z.infer<typeof CarouselTeaserSchema>
