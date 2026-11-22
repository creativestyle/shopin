import { z } from 'zod'
import { CrumbResponseSchema } from '../core/crumb'
import { ContentImageSchema } from '../content/content-image'

/** SEO fields for <head> meta and og tags; shared by pages and the data-source responses behind them. */
export const PageSeoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: ContentImageSchema.optional(),
  noIndex: z.boolean().optional(),
  /** Absolute URL overriding the derived canonical; unset means use the page's own URL. */
  canonicalUrl: z.string().optional(),
})
export type PageSeo = z.infer<typeof PageSeoSchema>

/** Base for pages that share breadcrumb (product, product-collection extend this). */
export const PageResponseSchema = z.object({
  breadcrumb: z.array(CrumbResponseSchema),
  seo: PageSeoSchema.optional(),
})
export type PageResponse = z.infer<typeof PageResponseSchema>
