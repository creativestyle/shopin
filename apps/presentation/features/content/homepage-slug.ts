/**
 * Homepage slug per URL prefix (Contentful page entry has different slug per locale).
 * Used when fetching the homepage so the correct locale is returned (e.g. en "homepage", de "startseite").
 */

export const HOMEPAGE_SLUG_BY_URL_PREFIX: Record<string, string> = {
  en: 'homepage',
  de: 'startseite',
}

export function getHomepageSlugForLocale(
  urlPrefix: string | undefined
): string {
  return HOMEPAGE_SLUG_BY_URL_PREFIX[urlPrefix ?? 'en'] ?? 'homepage'
}

/** True if the slug is the homepage in any locale (homepage, startseite, …). */
export function isHomepageSlug(slug: string): boolean {
  return Object.values(HOMEPAGE_SLUG_BY_URL_PREFIX).includes(slug)
}
