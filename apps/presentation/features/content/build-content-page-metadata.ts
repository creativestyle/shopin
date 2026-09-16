import type { Metadata } from 'next'
import type { ContentPageResponse } from '@core/contracts/content/page'
import { buildCanonicalUrl, buildHreflangLanguages } from '@/lib/site-url'
import { SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/site-metadata'
import { isHomepageSlug } from './homepage-slug'

/** The homepage lives at the locale root, so its slug never appears in the URL. */
function toPathSlug(slug: string): string {
  return isHomepageSlug(slug) ? '' : slug
}

export interface BuildContentPageMetadataParams {
  pageData: ContentPageResponse
  localePrefix: string
  baseUrl: string | undefined
}

/**
 * Build Next.js metadata from CMS content page (title, description, canonical, openGraph, twitter).
 * Shared by homepage and catch-all CMS route.
 */
export function buildContentPageMetadata({
  pageData,
  localePrefix,
  baseUrl,
}: BuildContentPageMetadataParams): Metadata {
  const pathSlug = toPathSlug(pageData.slug)
  const pathSlugByLocale = pageData.slugByLocale
    ? Object.fromEntries(
        Object.entries(pageData.slugByLocale).map(([locale, slug]) => [
          locale,
          toPathSlug(slug),
        ])
      )
    : undefined
  const derivedCanonical = baseUrl
    ? buildCanonicalUrl(baseUrl, localePrefix, pathSlug)
    : undefined
  const canonical = pageData.seo?.canonicalUrl ?? derivedCanonical
  const languages = baseUrl
    ? buildHreflangLanguages(baseUrl, pathSlug, pathSlugByLocale)
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
      images: [ogImage ? { url: ogImage } : DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage ?? DEFAULT_OG_IMAGE.url],
    },
  }
}
