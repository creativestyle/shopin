import type { Metadata } from 'next'
import type { ContentPageResponse } from '@core/contracts/content/page'
import { buildCanonicalUrl, buildHreflangLanguages } from '@/lib/site-url'

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
  const canonical = baseUrl
    ? buildCanonicalUrl(baseUrl, localePrefix, pageData.slug)
    : undefined
  const languages = baseUrl
    ? buildHreflangLanguages(baseUrl, pageData.slug, pageData.slugByLocale)
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
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}
