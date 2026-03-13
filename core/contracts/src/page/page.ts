import { z } from 'zod'
import { CrumbResponseSchema } from '../core/crumb'
import { ContentImageSchema } from '../content/content-image'

/** Base for pages that share breadcrumb (product, product-collection extend this). */
export const PageResponseSchema = z.object({
  breadcrumb: z.array(CrumbResponseSchema),
  /** Optional SEO for <head> meta and og tags. */
  seo: z
    .object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: ContentImageSchema.optional(),
      noIndex: z.boolean().optional(),
    })
    .optional(),
})
export type PageResponse = z.infer<typeof PageResponseSchema>
