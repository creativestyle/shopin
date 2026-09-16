import { buildCanonicalUrl } from '@/lib/site-url'
import type { JsonLdData } from './json-ld'
import {
  DEFAULT_OG_IMAGE,
  SEARCH_QUERY_PARAM,
  SITE_NAME,
} from './site-metadata'

export interface BuildSiteJsonLdParams {
  baseUrl: string | undefined
  localePrefix: string
}

/**
 * Organization + WebSite structured data for the homepage: brand identity and the
 * sitelinks searchbox target. Returns an empty array when the site origin is
 * unknown, since both types require absolute URLs.
 */
export function buildSiteJsonLd({
  baseUrl,
  localePrefix,
}: BuildSiteJsonLdParams): JsonLdData[] {
  if (!baseUrl) {
    return []
  }

  const homeUrl = buildCanonicalUrl(baseUrl, localePrefix)
  const searchUrl = buildCanonicalUrl(baseUrl, localePrefix, 'search')

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': SITE_NAME,
      'url': homeUrl,
      'logo': `${baseUrl}${DEFAULT_OG_IMAGE.url}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': SITE_NAME,
      'url': homeUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': `${searchUrl}?${SEARCH_QUERY_PARAM}={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ]
}
