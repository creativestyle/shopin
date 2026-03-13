import { z } from 'zod'
import { CmsLinkSchema, CmsButtonSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

/** Carousel item (image + optional caption + link). For slider hero-style slides: headline, body, cta. */
export const TeaserCarouselItemSchema = z.object({
  image: ContentImageSchema.optional(),
  caption: z.string().optional(),
  link: CmsLinkSchema.optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  cta: CmsButtonSchema.optional(),
})
export type TeaserCarouselItem = z.infer<typeof TeaserCarouselItemSchema>
