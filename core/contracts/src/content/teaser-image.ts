import { z } from 'zod'
import { CmsLinkSchema } from './cms-link'
import { ContentImageSchema } from './content-image'

export const ImageTeaserSchema = z.object({
  type: z.literal('image'),
  title: z.string().optional(),
  image: ContentImageSchema.optional(),
  caption: z.string().optional(),
  link: CmsLinkSchema.optional(),
})
export type ImageTeaser = z.infer<typeof ImageTeaserSchema>
