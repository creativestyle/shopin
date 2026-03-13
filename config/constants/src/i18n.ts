/**
 * Comprehensive i18n configuration following RFC standards
 * All language and country configuration centralized here
 */

// RFC 5646 Language Tags (ISO 639-1 + ISO 3166-1)
export type SupportedLanguage = 'en-US' | 'de-DE'

export interface LanguageInfo {
  name: string
  nativeName: string
  flag: string
  country: string
}

/**
 * Main i18n configuration - single source of truth
 */
export const I18N_CONFIG = {
  // Supported languages following RFC 5646
  supportedLanguages: ['en-US', 'de-DE'] as const,

  // Default language (fallback)
  defaultLanguage: 'en-US' as const,

  // Fallback language for missing translations
  fallbackLanguage: 'en-US' as const,

  // Accept-Language header configuration
  acceptLanguageHeader: 'accept-language' as const,
} as const

/**
 * Detailed language information following RFC standards
 */
export const LANGUAGE_CONFIG: Record<SupportedLanguage, LanguageInfo> = {
  'en-US': {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    country: 'United States',
  },
  'de-DE': {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    country: 'Germany',
  },
} as const

/**
 * URL prefix mapping - define what you want in URLs
 */
export const URL_PREFIXES: Record<SupportedLanguage, string> = {
  'en-US': 'en',
  'de-DE': 'de',
} as const

/**
 * Currency mapping - maps supported languages to their default currencies
 */
export const CURRENCY_MAP: Record<SupportedLanguage, string> = {
  'en-US': 'USD',
  'de-DE': 'EUR',
} as const

/**
 * Country mapping - maps supported languages to their default countries
 */
export const COUNTRY_MAP: Record<SupportedLanguage, string> = {
  'en-US': 'US',
  'de-DE': 'DE',
} as const

/**
 * Convert URL prefix back to RFC language format
 */
export function urlPrefixToRfc(prefix: string): SupportedLanguage {
  const entry = Object.entries(URL_PREFIXES).find(
    ([, urlPrefix]) => urlPrefix === prefix
  )
  return entry ? (entry[0] as SupportedLanguage) : I18N_CONFIG.defaultLanguage
}

/**
 * Convert Contentful/RFC locale (e.g. "en-US") to app URL prefix (e.g. "en").
 * Used when Contentful preview sends locale=en-US so we redirect to /en/... not /en-US/...
 */
export function rfcToUrlPrefix(rfc: string): string {
  const normalized = rfc.trim()
  const entry = Object.entries(URL_PREFIXES).find(
    ([rfcKey]) => rfcKey.toLowerCase() === normalized.toLowerCase()
  )
  if (entry) {
    return entry[1]
  }
  const lang = normalized.split('-')[0]
  return lang ?? URL_PREFIXES[I18N_CONFIG.defaultLanguage]
}
