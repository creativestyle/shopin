import { z } from 'zod'
import { CmsButtonSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

export const BannerTeaserSchema = z.object({
  type: z.literal('banner'),
  backgroundImage: ContentImageSchema.optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  cta: CmsButtonSchema.optional(),
})
export type BannerTeaser = z.infer<typeof BannerTeaserSchema>
