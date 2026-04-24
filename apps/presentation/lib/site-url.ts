import { I18N_CONFIG, listLocales } from '@config/constants'

const ENV_VAR = 'FRONTEND_URL'

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
