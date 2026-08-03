import { getLocale, I18N_CONFIG, listLocales } from '@config/constants'

/**
 * Paths that must stay out of the index: transactional flows, authenticated
 * areas, internal/demo routes and search result pages. Each entry covers the
 * whole subtree below it.
 *
 * Note these are *crawl* rules, not the only defence — faceted PLP URLs are kept
 * crawlable on purpose and handled with `noindex, follow` in page metadata, because
 * a robots.txt-blocked URL never gets read far enough for the crawler to see a
 * noindex directive.
 */
export const NON_INDEXABLE_PATHS = [
  '/account',
  '/api',
  '/cart',
  '/checkout',
  '/demo',
  '/forgot-password',
  '/preview',
  '/reset-password',
  '/search',
  '/setup',
  '/sign-in',
  '/sign-up',
  '/wishlist',
] as const

/**
 * Locale set built once at module load. These helpers run per link while
 * collecting sitemap URLs, so rebuilding the locale list on every call would make
 * discovery cost scale with catalog size for no reason.
 */
const LOCALE_URL_PREFIXES: ReadonlySet<string> = new Set(
  listLocales().map((locale) => locale.urlPrefix)
)

/** True when `path` is (or sits under) a non-indexable route, locale prefix ignored. */
export function isNonIndexablePath(path: string): boolean {
  const withoutLocale = stripLocalePrefix(path)
  return NON_INDEXABLE_PATHS.some(
    (blocked) =>
      withoutLocale === blocked || withoutLocale.startsWith(`${blocked}/`)
  )
}

/** Removes a leading locale prefix ("/de/foo" → "/foo"); returns other paths unchanged. */
export function stripLocalePrefix(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const [, firstSegment, ...rest] = normalized.split('/')
  return firstSegment && LOCALE_URL_PREFIXES.has(firstSegment)
    ? `/${rest.join('/')}`
    : normalized
}

/**
 * robots.txt disallow list: every non-indexable path, plus its locale-prefixed
 * variants. The default locale is served without a prefix (next-intl
 * localePrefix: 'as-needed'), so only the other locales need prefixed entries.
 */
export function buildDisallowedPaths(): string[] {
  const defaultPrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix
  const prefixes = listLocales()
    .map((l) => l.urlPrefix)
    .filter((prefix) => prefix !== defaultPrefix)

  // Plain prefixes (no trailing slash): "Disallow: /cart" covers both /cart and
  // /cart/…, whereas "Disallow: /cart/" would leave /cart itself crawlable.
  return NON_INDEXABLE_PATHS.flatMap((path) => [
    path,
    ...prefixes.map((prefix) => `/${prefix}${path}`),
  ])
}
