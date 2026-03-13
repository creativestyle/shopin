import { z } from 'zod'
import { CmsButtonSchema } from './cms-link'

export const HeadlineTeaserSchema = z.object({
  type: z.literal('headline'),
  headline: z.string(),
  subtext: z.string().optional(),
  cta: CmsButtonSchema.optional(),
})
export type HeadlineTeaser = z.infer<typeof HeadlineTeaserSchema>
