import type { MetadataRoute } from 'next'
import { tryGetSiteBaseUrl } from '@/lib/site-url'
import { buildDisallowedPaths } from '@/features/seo/non-indexable-paths'

/**
 * /robots.txt — crawlable storefront with transactional, authenticated and
 * internal routes excluded (see NON_INDEXABLE_PATHS), plus a pointer to the sitemap.
 *
 * The Sitemap line is omitted when FRONTEND_URL is unset: the protocol requires an
 * absolute URL there, and robots.txt must never fail to build. No `Host` directive
 * is emitted — it is a non-standard Yandex-only field that expects a bare hostname,
 * so feeding it a full origin produces a line no crawler can use.
 *
 * Note: a hosting platform may serve its own robots.txt for non-production
 * environments (the demo deployment does, with `Disallow: /` plus an
 * `X-Robots-Tag: noindex` response header). That takes precedence over this file
 * on those environments by design.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = tryGetSiteBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: buildDisallowedPaths(),
    },
    ...(baseUrl && { sitemap: `${baseUrl}/sitemap.xml` }),
  }
}
