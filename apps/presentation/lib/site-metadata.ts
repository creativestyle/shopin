/**
 * Brand metadata shared between the root layout and per-page metadata.
 * Next.js merges metadata shallowly, so a page defining openGraph/twitter replaces the
 * layout's object entirely — pages must spread these in rather than inherit them.
 */

export const SITE_NAME = 'SHOPin'

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: SITE_NAME,
}
