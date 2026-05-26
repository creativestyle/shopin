import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { getSiteBaseUrl } from '@/lib/site-url'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string[] }>
}): Promise<Metadata> {
  const { locale, page } = await params
  setRequestLocale(locale)
  const cmsSlug = getCmsSlug(page)
  if (!cmsSlug) {
    return {}
  }

  try {
    const [pageData, baseUrl] = await Promise.all([
      getContentPage(cmsSlug),
      getSiteBaseUrl(),
    ])
    return buildContentPageMetadata({
      pageData,
      localePrefix: locale,
      baseUrl,
    })
  } catch {
    return {}
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; page: string[] }>
}) {
  const { locale, page } = await params
  setRequestLocale(locale)
  const cmsSlug = getCmsSlug(page)
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
