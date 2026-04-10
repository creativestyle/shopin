import { z } from 'zod'
import { CmsLinkSchema } from './cms-link'

export const VideoTeaserSchema = z.object({
  type: z.literal('video'),
  title: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  autoplay: z.boolean(),
  controls: z.boolean(),
  caption: z.string().optional(),
  link: CmsLinkSchema.optional(),
})
export type VideoTeaser = z.infer<typeof VideoTeaserSchema>
