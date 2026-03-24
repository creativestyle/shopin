import { z } from 'zod'
import { CmsLinkSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

/** Brand item (image + optional caption + link). Shared by TeaserBrand. */
export const TeaserBrandItemSchema = z.object({
  image: ContentImageSchema,
  caption: z.string().optional(),
  link: CmsLinkSchema.optional(),
})
export type TeaserBrandItem = z.infer<typeof TeaserBrandItemSchema>
