import { z } from 'zod'
import { CmsButtonSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

export const HeroTeaserSchema = z.object({
  type: z.literal('hero'),
  backgroundImage: ContentImageSchema.optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  cta: CmsButtonSchema.optional(),
})
export type HeroTeaser = z.infer<typeof HeroTeaserSchema>
