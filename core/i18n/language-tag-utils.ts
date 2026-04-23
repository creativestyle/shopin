/**
 * RFC 5646 Language Tag utilities
 */

import {
  I18N_CONFIG,
  SupportedLocale,
  getDefaultLocale,
  getLocale,
} from '@config/constants'

export class LanguageTagUtils {
  /**
   * Parse language tag (e.g., "en-US", "de-DE")
   */
  static parseLanguageTag(tag: string): { language: string; country?: string } {
    const parts = tag.split('-')
    return {
      language: parts[0]?.toLowerCase() || '',
      country: parts[1]?.toUpperCase() || undefined,
    }
  }

  /**
   * Validate RFC 5646 language tag
   */
  static isValidLanguageTag(tag: string): boolean {
    const { language, country } = this.parseLanguageTag(tag)

    // Basic validation: 2-letter language code, optional 2-letter country code
    const languageRegex = /^[a-z]{2}$/
    const countryRegex = /^[A-Z]{2}$/

    return (
      languageRegex.test(language) && (!country || countryRegex.test(country))
    )
  }

  /**
   * Get base language from language tag (e.g., "en-US" -> "en")
   */
  static getBaseLanguage(tag: string): string {
    return this.parseLanguageTag(tag).language
  }

  /**
   * Get country from language tag (e.g., "en-US" -> "US")
   */
  static getCountry(tag: string): string | undefined {
    return this.parseLanguageTag(tag).country
  }

  /**
   * Check if language tag is supported
   */
  static isSupported(tag: string): tag is SupportedLocale {
    return I18N_CONFIG.supportedLocales.includes(tag as SupportedLocale)
  }

  /**
   * Convert language tag to underscore key (e.g., "en-US" -> "en_US").
   * Useful for Algolia field name conventions.
   */
  static toUnderscoreKey(tag: string): string {
    return tag.replace('-', '_')
  }
}

/** Resolves the ISO 3166-1 alpha-2 country code for a given RFC 5646 language tag. */
export function resolveCountryFromLanguage(language: string): string {
  return (
    LanguageTagUtils.getCountry(getLocale(language).language) ??
    LanguageTagUtils.getCountry(getDefaultLocale().language) ??
    getDefaultLocale().language.split('-')[1]!
  )
}
