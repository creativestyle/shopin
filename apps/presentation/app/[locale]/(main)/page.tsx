import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { ContentPage } from '@/features/content/content-page'
import { buildContentPageMetadata } from '@/features/content/build-content-page-metadata'
import { getContentPage } from '@/features/content/get-content-page'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import { getSiteBaseUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'

/**
 * Homepage metadata from CMS (same SEO fields as other content pages).
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const localePrefix = (await getLocale()) ?? 'en'
    const slug = getHomepageSlugForLocale(localePrefix)
    const [pageData, baseUrl] = await Promise.all([
      getContentPage(slug),
      getSiteBaseUrl(),
    ])
    return buildContentPageMetadata({
      pageData,
      localePrefix,
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

/**
 * Homepage uses the same content layout as other CMS pages (hero full width, grid, breadcrumb).
 */
export default async function Home() {
  const localePrefix = (await getLocale()) ?? 'en'
  const slug = getHomepageSlugForLocale(localePrefix)
  return <ContentPage slug={slug} />
}
