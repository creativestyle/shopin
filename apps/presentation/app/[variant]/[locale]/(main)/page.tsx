import type { Metadata } from 'next'
import { initRouteContext } from '@/lib/request-context/route-context'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import { getSiteBaseUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}): Promise<Metadata> {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })
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
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })
  const slug = getHomepageSlugForLocale(locale)
  return <ContentPage slug={slug} />
}
