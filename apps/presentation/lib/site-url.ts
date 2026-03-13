import { I18N_CONFIG, URL_PREFIXES } from '@config/constants'

const ENV_VAR = 'FRONTEND_URL'

/** Strip leading and trailing slashes so joining segments never produces double slashes. */
function trimSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, '')
}

/**
 * Base URL of the site (origin) for canonical URLs and absolute links.
 * Requires FRONTEND_URL to be set; no fallbacks.
 */
export function getSiteBaseUrl(): string {
  const value = process.env[ENV_VAR]?.trim()
  if (!value) {
    throw new Error(
      `${ENV_VAR} is required. Set it to the site origin (e.g. https://example.com).`
    )
  }
  return value.replace(/\/$/, '')
}

/**
 * Build canonical URL for a page: baseUrl + / + localePrefix + / + slug.
 * Trims leading/trailing slashes from each segment and omits empty segments to avoid double slashes.
 */
export function buildCanonicalUrl(
  baseUrl: string,
  localePrefix: string,
  slug: string
): string {
  const segments = [baseUrl, localePrefix, slug]
    .map(trimSlashes)
    .filter(Boolean)
  return segments.join('/')
}

/**
 * Build alternates.languages for Metadata (hreflang link tags).
 * Uses slugByLocale when present (e.g. DE "ueber-uns" vs EN "about-us"); otherwise one slug for all.
 * Returns e.g. { 'en-US': 'https://site.com/en/about-us', 'de-DE': 'https://site.com/de/ueber-uns', 'x-default': '...' }.
 */
export function buildHreflangLanguages(
  baseUrl: string,
  slug: string,
  slugByLocale?: Record<string, string>
): Record<string, string> {
  const base = baseUrl.replace(/\/$/, '')
  const slugFor = (rfc: string) => slugByLocale?.[rfc] ?? slug
  const languages: Record<string, string> = {}
  for (const [rfc, prefix] of Object.entries(URL_PREFIXES)) {
    languages[rfc] = buildCanonicalUrl(base, prefix, slugFor(rfc))
  }
  languages['x-default'] = languages[I18N_CONFIG.defaultLanguage]
  return languages
}
