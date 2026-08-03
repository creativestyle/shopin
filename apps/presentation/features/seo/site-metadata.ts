/**
 * Site-level SEO constants shared by the root layout and the per-template
 * metadata builders. Kept in one place because Next.js merges metadata
 * *shallowly*: a page that sets `openGraph` replaces the root layout's object
 * entirely, so every builder has to re-state siteName / default image itself.
 */

export const SITE_NAME = 'SHOPin'

export const SITE_TITLE = 'SHOPin - E-commerce Platform'

export const SITE_DESCRIPTION =
  'Modern e-commerce platform with a comprehensive design system'

/** Fallback social sharing image (in /public), used when a page has no own image. */
export const DEFAULT_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const

/** Search results query parameter — also used by the WebSite SearchAction target. */
export const SEARCH_QUERY_PARAM = 'q'

/** Max length of a generated meta description before it is truncated. */
export const META_DESCRIPTION_MAX_LENGTH = 160
