import type { Metadata } from 'next'
import { initRouteContext } from '@/lib/request-context/route-context'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import { getSiteBaseUrl, tryGetSiteBaseUrl } from '@/lib/site-url'
import { JsonLd } from '@/features/seo/json-ld'
import { buildSiteJsonLd } from '@/features/seo/build-site-json-ld'
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
  const siteJsonLd = buildSiteJsonLd({
    baseUrl: tryGetSiteBaseUrl(),
    localePrefix: locale,
  })

  return (
    <>
      {siteJsonLd.length > 0 && <JsonLd data={siteJsonLd} />}
      <ContentPage slug={slug} />
    </>
  )
}
