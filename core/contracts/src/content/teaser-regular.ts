import { z } from 'zod'
import { CmsButtonSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

export const RegularTeaserSchema = z.object({
  type: z.literal('regular'),
  image: ContentImageSchema.optional(),
  categoryLabel: z.string().optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  cta: CmsButtonSchema.optional(),
})
export type RegularTeaser = z.infer<typeof RegularTeaserSchema>
