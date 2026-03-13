import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { getSiteBaseUrl } from '@/lib/site-url'

interface PageProps {
  params: Promise<{ locale?: string; page: string[] }>
}

/** Paths with a file extension (e.g. .html, .json) are not CMS pages — 404. */
function hasFileExtension(slug: string): boolean {
  const lastSegment = slug.includes('/')
    ? slug.slice(slug.lastIndexOf('/') + 1)
    : slug
  return lastSegment.includes('.')
}

function getCmsSlug(pageSegments: string[] | undefined): string | null {
  const slug = pageSegments?.length ? pageSegments.join('/') : null
  if (!slug || hasFileExtension(slug)) {
    return null
  }
  return slug
}

/**
 * CMS page metadata: title, description, canonical, openGraph, twitter, robots from page SEO.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const cmsSlug = getCmsSlug((await params).page)
  if (!cmsSlug) {
    return {}
  }

  try {
    const [pageData, localePrefixRes, baseUrl] = await Promise.all([
      getContentPage(cmsSlug),
      getLocale(),
      getSiteBaseUrl(),
    ])
    const localePrefix = localePrefixRes ?? 'en'
    return buildContentPageMetadata({
      pageData,
      localePrefix,
      baseUrl,
    })
  } catch {
    return {}
  }
}

/**
 * CMS catch-all: URL path → CMS slug (no /content/ prefix).
 * - /en/about → slug "about", /en/legal/privacy → "legal/privacy"
 * Paths with a file extension 404. Reserved paths use their own routes.
 */
export default async function CmsPageByPath({ params }: PageProps) {
  const cmsSlug = getCmsSlug((await params).page)
  if (!cmsSlug) {
    notFound()
  }

  try {
    await getContentPage(cmsSlug)
  } catch {
    notFound()
  }

  return <ContentPage slug={cmsSlug} />
}
