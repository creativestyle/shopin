import { z } from 'zod'
import { PageResponseSchema } from '../page/page'
import { TeaserResponseSchema } from './teaser'

/** Path param: content page slug (non-empty). */
export const ContentSlugSchema = z.string().min(1)

/** Content (CMS) page: slug, breadcrumb, page title, visibility, optional parent, and components. */
export const ContentPageResponseSchema = PageResponseSchema.extend({
  slug: z.string(),
  /**
   * Slug per locale (e.g. { 'en-US': 'about-us', 'de-DE': 'ueber-uns' }) for correct hreflang/canonical.
   * When set, use for alternates; otherwise fall back to single slug for all locales.
   */
  slugByLocale: z.record(z.string(), z.string()).optional(),
  pageTitle: z.string().optional(),
  pageTitleVisibility: z.enum(['visible', 'srOnly']).optional(),
  /** Parent page slug for breadcrumb/hierarchy; resolved from Contentful parentPage link. */
  parentPageSlug: z.string().optional(),
  components: z.array(TeaserResponseSchema).default([]),
})

export type ContentPageResponse = z.infer<typeof ContentPageResponseSchema>
