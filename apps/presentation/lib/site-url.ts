import { I18N_CONFIG, listLocales, getDefaultLocale } from '@config/constants'

const ENV_VAR = 'FRONTEND_URL'

let warnedMissingBaseUrl = false

function trimSlashes(s: string): string {
  return s.replace(/^\/+|\/+$/g, '')
}

/**
 * Site origin from FRONTEND_URL, or undefined when unset.
 * Returns undefined rather than throwing so a missing origin only costs the canonical and
 * hreflang tags — callers build metadata in a try/catch, and throwing here would discard the
 * whole object, including the noIndex directive.
 */
export function getSiteBaseUrl(): string | undefined {
  const value = process.env[ENV_VAR]?.trim()
  if (!value) {
    if (!warnedMissingBaseUrl) {
      warnedMissingBaseUrl = true
      console.warn(
        `${ENV_VAR} is not set — canonical and hreflang tags will be omitted.`
      )
    }
    return undefined
  }
  return value.replace(/\/$/, '')
}

/**
 * Absolute URL for a locale and slug. The default locale carries no URL prefix
 * (next-intl localePrefix: 'as-needed'), and an empty slug is the locale root.
 */
export function buildCanonicalUrl(
  baseUrl: string,
  localePrefix: string,
  slug: string
): string {
  const prefix =
    localePrefix === getDefaultLocale().urlPrefix ? '' : localePrefix
  const path = [prefix, slug].map(trimSlashes).filter(Boolean).join('/')
  const origin = trimSlashes(baseUrl)
  return path ? `${origin}/${path}` : `${origin}/`
}

export function buildHreflangLanguages(
  baseUrl: string,
  slug: string,
  slugByLocale?: Record<string, string>
): Record<string, string> {
  const base = baseUrl.replace(/\/$/, '')
  const slugFor = (rfc: string) => slugByLocale?.[rfc] ?? slug
  const languages: Record<string, string> = {}
  for (const { language, urlPrefix } of listLocales()) {
    languages[language] = buildCanonicalUrl(base, urlPrefix, slugFor(language))
  }
  languages['x-default'] = languages[I18N_CONFIG.defaultLocale]
  return languages
}
