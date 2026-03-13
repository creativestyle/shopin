import { LanguageTagUtils } from './language-tag-utils'
import {
  CURRENCY_MAP,
  COUNTRY_MAP,
  I18N_CONFIG,
  type SupportedLanguage,
} from '@config/constants'

/**
 * Resolves currency code from language tag
 * Maps supported languages to their default currencies
 */
export function resolveCurrencyFromLanguage(language: string): string {
  return (
    CURRENCY_MAP[language as SupportedLanguage] ??
    CURRENCY_MAP[I18N_CONFIG.defaultLanguage]
  )
}

/**
 * Resolves country code from language tag
 * Extracts country code from RFC 5646 language tag (e.g., "en-US" -> "US")
 */
export function resolveCountryFromLanguage(language: string): string {
  const country = LanguageTagUtils.getCountry(language)
  if (country) {
    return country
  }

  return (
    COUNTRY_MAP[language as SupportedLanguage] ??
    COUNTRY_MAP[I18N_CONFIG.defaultLanguage]
  )
}
