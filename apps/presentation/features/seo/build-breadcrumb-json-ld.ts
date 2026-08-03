import type { CrumbResponse } from '@core/contracts/core/crumb'
import { buildCanonicalUrl } from '@/lib/site-url'
import type { JsonLdData } from './json-ld'

export interface BuildBreadcrumbJsonLdParams {
  /** Breadcrumb trail as returned by the BFF (paths are locale-less, e.g. /c/audio). */
  crumbs: CrumbResponse[]
  baseUrl: string | undefined
  localePrefix: string
  /** Label of the leading home crumb, matching the visible breadcrumbs. */
  homeLabel?: string
}

/**
 * BreadcrumbList structured data mirroring the visible breadcrumb trail
 * (including its leading home link) so Google can render breadcrumbs in the SERP.
 * Returns undefined when the site origin is unknown or the trail is empty —
 * absolute `item` URLs are required by the spec.
 */
export function buildBreadcrumbJsonLd({
  crumbs,
  baseUrl,
  localePrefix,
  homeLabel,
}: BuildBreadcrumbJsonLdParams): JsonLdData | undefined {
  if (!baseUrl || crumbs.length === 0) {
    return undefined
  }

  const allCrumbs = homeLabel
    ? [{ label: homeLabel, path: '/' }, ...crumbs]
    : crumbs

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': allCrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.label,
      'item': buildCanonicalUrl(baseUrl, localePrefix, crumb.path),
    })),
  }
}
