import { z } from 'zod'
import { CmsLinkSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

/** Section Teaser – two-column: category label, headline, body, subcategory links (left) and image (right) */
export const SectionTeaserSchema = z.object({
  type: z.literal('section'),
  categoryLabel: z.string().optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  subcategoryLinks: z.array(CmsLinkSchema).optional(),
  image: ContentImageSchema.optional(),
})
export type SectionTeaser = z.infer<typeof SectionTeaserSchema>
