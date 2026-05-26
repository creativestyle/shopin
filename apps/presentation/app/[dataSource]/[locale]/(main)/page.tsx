import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import { getSiteBaseUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  setRequestLocale(locale)
  try {
    const slug = getHomepageSlugForLocale(locale)
    const [pageData, baseUrl] = await Promise.all([
      getContentPage(slug),
      getSiteBaseUrl(),
    ])
    return buildContentPageMetadata({
      pageData,
      localePrefix: locale,
      baseUrl,
    })
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to build homepage metadata'
    )
    return {}
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const slug = getHomepageSlugForLocale(locale)
  return <ContentPage slug={slug} />
}
