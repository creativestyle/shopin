import { I18N_CONFIG, getLocale, listLocales } from '@config/constants'

const ENV_VAR = 'FRONTEND_URL'

/**
 * URL prefix of the default locale ("en"). next-intl runs with
 * localePrefix: 'as-needed', so the default locale is served WITHOUT a prefix —
 * /en/foo 307-redirects to /foo. Canonicals and hreflang must therefore omit it,
 * otherwise every one of them points at a redirect.
 */
const DEFAULT_LOCALE_URL_PREFIX = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

function trimSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, '')
}

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
 * Same as getSiteBaseUrl() but returns undefined instead of throwing.
 * For callers that must not fail the render/build when the site origin is
 * unconfigured (robots.txt, sitemap.xml).
 */
export function tryGetSiteBaseUrl(): string | undefined {
  const value = process.env[ENV_VAR]?.trim()
  return value ? value.replace(/\/$/, '') : undefined
}

/**
 * Absolute, canonical URL for a page.
 *
 * The default locale prefix is dropped (see DEFAULT_LOCALE_URL_PREFIX) and path
 * segments are joined slash-safely, so callers can pass route prefixes and slugs
 * separately, e.g. buildCanonicalUrl(base, 'de', 'p', 'rote-schuhe').
 * With no path segments the site root ("https://example.com/") is returned.
 */
export function buildCanonicalUrl(
  baseUrl: string,
  localePrefix: string,
  ...pathSegments: string[]
): string {
  const prefix =
    localePrefix === DEFAULT_LOCALE_URL_PREFIX ? '' : (localePrefix ?? '')
  const segments = [prefix, ...pathSegments].map(trimSlashes).filter(Boolean)
  const base = baseUrl.replace(/\/$/, '')
  return segments.length > 0 ? `${base}/${segments.join('/')}` : `${base}/`
}

/**
 * hreflang map (RFC 5646 tag → absolute URL) for one page across all locales.
 *
 * @param slug - Slug used for locales missing from slugByLocale. Pass '' for the site root.
 * @param slugByLocale - Localized slugs keyed by RFC 5646 tag (e.g. { 'de-DE': 'rote-schuhe' }).
 * @param pathPrefix - Route prefix in front of the slug (e.g. 'p' for PDP, 'c' for PLP).
 */
export function buildHreflangLanguages(
  baseUrl: string,
  slug: string,
  slugByLocale?: Record<string, string>,
  pathPrefix = ''
): Record<string, string> {
  const base = baseUrl.replace(/\/$/, '')
  const slugFor = (rfc: string) => slugByLocale?.[rfc] ?? slug
  const languages: Record<string, string> = {}
  for (const { language, urlPrefix } of listLocales()) {
    languages[language] = buildCanonicalUrl(
      base,
      urlPrefix,
      pathPrefix,
      slugFor(language)
    )
  }
  languages['x-default'] = languages[I18N_CONFIG.defaultLocale]
  return languages
}
