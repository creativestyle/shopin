import type { Metadata } from 'next'
import type { ContentPageResponse } from '@core/contracts/content/page'
import { buildCanonicalUrl, buildHreflangLanguages } from '@/lib/site-url'
import { DEFAULT_OG_IMAGE, SITE_NAME } from '@/features/seo/site-metadata'
import { isHomepageSlug } from './homepage-slug'

export interface BuildContentPageMetadataParams {
  pageData: ContentPageResponse
  localePrefix: string
  baseUrl: string | undefined
}

/**
 * Build Next.js metadata from CMS content page (title, description, canonical, openGraph, twitter).
 * Shared by homepage and catch-all CMS route.
 *
 * The homepage renders at two URLs — the locale root and its CMS slug (/ and
 * /homepage, /de and /de/startseite) — so canonical and hreflang always resolve
 * to the locale root for it, whichever URL was requested.
 */
export function buildContentPageMetadata({
  pageData,
  localePrefix,
  baseUrl,
}: BuildContentPageMetadataParams): Metadata {
  const isHomepage = isHomepageSlug(pageData.slug)
  const canonicalSlug = isHomepage ? '' : pageData.slug
  const slugByLocale = isHomepage ? undefined : pageData.slugByLocale

  const canonical = baseUrl
    ? buildCanonicalUrl(baseUrl, localePrefix, canonicalSlug)
    : undefined
  const languages = baseUrl
    ? buildHreflangLanguages(baseUrl, canonicalSlug, slugByLocale)
    : undefined

  const title = pageData.seo?.metaTitle ?? pageData.pageTitle ?? pageData.slug
  const description = pageData.seo?.metaDescription
  const ogImage = pageData.seo?.ogImage?.url

  return {
    title,
    description,
    robots: pageData.seo?.noIndex === true ? 'noindex, nofollow' : undefined,
    alternates:
      canonical || languages
        ? { ...(canonical && { canonical }), ...(languages && { languages }) }
        : undefined,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage ?? DEFAULT_OG_IMAGE.url],
    },
  }
}
