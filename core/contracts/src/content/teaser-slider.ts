import { z } from 'zod'
import { TeaserCarouselItemSchema } from './teaser-carousel-item'

/** Slider Teaser – slide-based slider (image/caption/link per slide) */
export const SliderTeaserSchema = z.object({
  type: z.literal('slider'),
  title: z.string().optional(),
  items: z.array(TeaserCarouselItemSchema),
})
export type SliderTeaser = z.infer<typeof SliderTeaserSchema>
