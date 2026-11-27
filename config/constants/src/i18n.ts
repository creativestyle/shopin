/**
 * The shop's locales. The table is the shop's own file, `config/locales.json`; `npm run setup` copies it to
 * `./locales.json` (do not edit the copy) so every app and integration reads one list. Each key is an RFC 5646
 * tag; the first is the default locale. A commerce platform's store per locale is that integration's option,
 * not part of a locale.
 */
import locales from './locales.json'

export type SupportedLocale = keyof typeof locales & string

export interface Locale {
  /** RFC 5646 language tag (the key in config/locales.json) */
  language: SupportedLocale
  /** URL path prefix shown in the browser (e.g. "en", "de") */
  urlPrefix: string
  /** Native display name shown in the language switcher */
  nativeName: string
  /** ISO 4217 currency code */
  currency: string
}

const LOCALES: Readonly<Record<SupportedLocale, Locale>> = Object.fromEntries(
  Object.entries(locales).map(([language, entry]) => [
    language,
    { ...entry, language },
  ])
) as Record<SupportedLocale, Locale>

const supportedLocales = Object.keys(LOCALES) as SupportedLocale[]

export const I18N_CONFIG: {
  readonly supportedLocales: readonly SupportedLocale[]
  readonly defaultLocale: SupportedLocale
} = {
  supportedLocales,
  defaultLocale: supportedLocales[0]!,
}

/** Returns the Locale entry for the given RFC 5646 tag, falling back to default. */
export function getLocale(language: string): Locale {
  return (
    LOCALES[language as SupportedLocale] ?? LOCALES[I18N_CONFIG.defaultLocale]
  )
}

/** Returns all configured languages in a stable order. */
export function listLocales(): Locale[] {
  return Object.values(LOCALES)
}

/** Returns the default language entry. */
export function getDefaultLocale(): Locale {
  return LOCALES[I18N_CONFIG.defaultLocale]
}

/** Removes a leading locale prefix ("/de/foo" → "/foo", "/de" → ""); other paths keep a leading slash. */
export function stripLocalePrefix(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  for (const { urlPrefix } of listLocales()) {
    if (normalized === `/${urlPrefix}`) {
      return ''
    }
    if (normalized.startsWith(`/${urlPrefix}/`)) {
      return normalized.slice(urlPrefix.length + 1)
    }
  }
  return normalized
}

/** Converts a URL prefix to an RFC 5646 language tag (e.g. "en" → "en-US"). */
export function urlPrefixToRfc(prefix: string): SupportedLocale {
  const entry = listLocales().find((l) => l.urlPrefix === prefix)
  return entry ? entry.language : I18N_CONFIG.defaultLocale
}

/**
 * Converts an RFC 5646 locale to its URL prefix (e.g. "en-US" → "en").
 * Also handles CMS preview locales that may differ in casing.
 */
export function rfcToUrlPrefix(rfc: string): string {
  const normalized = rfc.trim().toLowerCase()
  const entry = listLocales().find(
    (l) => l.language.toLowerCase() === normalized
  )
  if (entry) {
    return entry.urlPrefix
  }
  const lang = normalized.split('-')[0]
  return lang ?? getDefaultLocale().urlPrefix
}
