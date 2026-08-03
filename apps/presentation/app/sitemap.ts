import type { MetadataRoute } from 'next'
import { SITEMAP_REVALIDATE_SECONDS } from '@config/constants'
import { tryGetSiteBaseUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'
import { getSitemapEntries } from '@/features/seo/get-sitemap-entries'

/**
 * Regenerated at most once an hour. The collectors behind getSitemapEntries fail
 * soft, so an unreachable BFF (e.g. during `next build`) yields a smaller sitemap
 * that fills in on the next revalidation instead of breaking the build.
 */
export const revalidate = SITEMAP_REVALIDATE_SECONDS

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = tryGetSiteBaseUrl()
  if (!baseUrl) {
    logger.error(
      'FRONTEND_URL is not set — serving an empty sitemap (absolute URLs required).'
    )
    return []
  }

  return getSitemapEntries(baseUrl)
}
