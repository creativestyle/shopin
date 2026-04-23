/**
 * Central locale configuration. Add a new language here to enable it across the entire stack.
 * Each entry maps an RFC 5646 language tag to its presentation (URL, display name)
 * and commerce (commercetools store, currency) settings.
 */

export type SupportedLocale = 'en-US' | 'de-DE'

export interface Locale {
  /** RFC 5646 language tag — same as the config key, kept for ergonomic iteration */
  language: SupportedLocale
  /** URL path prefix shown in the browser (e.g. "en", "de") */
  urlPrefix: string
  /** Native display name shown in the language switcher */
  nativeName: string
  /** commercetools Store key — overridable per-environment via COMMERCETOOLS_STORE_KEYS */
  ctStoreKey: string
  /** ISO 4217 currency code */
  currency: string
}

export const LOCALE_CONFIG: Record<SupportedLocale, Locale> = {
  'en-US': {
    language: 'en-US',
    urlPrefix: 'en',
    nativeName: 'English',
    ctStoreKey: 'us-store',
    currency: 'USD',
  },
  'de-DE': {
    language: 'de-DE',
    urlPrefix: 'de',
    nativeName: 'Deutsch',
    ctStoreKey: 'eu-store',
    currency: 'EUR',
  },
} as const

export const I18N_CONFIG = {
  supportedLocales: Object.keys(LOCALE_CONFIG) as readonly SupportedLocale[],
  defaultLocale: 'en-US' as const,
} as const

/** Returns the Locale entry for the given RFC 5646 tag, falling back to default. */
export function getLocale(language: string): Locale {
  return (
    LOCALE_CONFIG[language as SupportedLocale] ??
    LOCALE_CONFIG[I18N_CONFIG.defaultLocale]
  )
}

/** Returns all configured languages in a stable order. */
export function listLocales(): Locale[] {
  return Object.values(LOCALE_CONFIG)
}

/** Returns the default language entry. */
export function getDefaultLocale(): Locale {
  return LOCALE_CONFIG[I18N_CONFIG.defaultLocale]
}

/** Converts a URL prefix to an RFC 5646 language tag (e.g. "en" → "en-US"). */
export function urlPrefixToRfc(prefix: string): SupportedLocale {
  const entry = Object.values(LOCALE_CONFIG).find((l) => l.urlPrefix === prefix)
  return entry ? entry.language : I18N_CONFIG.defaultLocale
}

/**
 * Converts an RFC 5646 locale to its URL prefix (e.g. "en-US" → "en").
 * Also handles CMS preview locales that may differ in casing.
 */
export function rfcToUrlPrefix(rfc: string): string {
  const normalized = rfc.trim().toLowerCase()
  const entry = Object.values(LOCALE_CONFIG).find(
    (l) => l.language.toLowerCase() === normalized
  )
  if (entry) {
    return entry.urlPrefix
  }
  const lang = normalized.split('-')[0]
  return lang ?? getDefaultLocale().urlPrefix
}
