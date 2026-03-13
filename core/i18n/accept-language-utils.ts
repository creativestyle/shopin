/**
 * Accept-Language header utilities for building and decoding language preferences
 * Following RFC 7231 standards
 */

import { I18N_CONFIG, SupportedLanguage } from '@config/constants'

export class AcceptLanguageUtils {
  /**
   * Parse Accept-Language header according to RFC 7231
   * @param acceptLanguage - Accept-Language header value
   * @returns Array of language preferences sorted by quality (highest first)
   */
  private static parseAcceptLanguageHeader(
    acceptLanguage: string
  ): Array<{ language: string; quality: number }> {
    if (!acceptLanguage) {
      return []
    }

    return acceptLanguage
      .split(',')
      .map((lang) => {
        const [language, qValue] = lang.trim().split(';q=')
        const quality = qValue ? parseFloat(qValue) : 1.0
        return { language: language?.trim() || '', quality }
      })
      .filter((item) => item.language) // Filter out empty languages
      .sort((a, b) => b.quality - a.quality) // Sort by quality (highest first)
  }

  /**
   * Find the best supported language from Accept-Language header
   * @param acceptLanguage - Accept-Language header value
   * @returns Best supported language or default language
   */
  static getBestSupportedLanguage(acceptLanguage: string): SupportedLanguage {
    const preferences = this.parseAcceptLanguageHeader(acceptLanguage)

    // Find the first supported language
    for (const { language } of preferences) {
      if (
        I18N_CONFIG.supportedLanguages.includes(language as SupportedLanguage)
      ) {
        return language as SupportedLanguage
      }
    }

    return I18N_CONFIG.defaultLanguage
  }

  /**
   * Build Accept-Language header for client requests
   * @param currentLocale - Current locale to prioritize
   * @returns Accept-Language header value
   */
  static buildClientAcceptLanguageHeader(
    currentLocale: SupportedLanguage
  ): string {
    const languages: Array<
      SupportedLanguage | { language: SupportedLanguage; quality: number }
    > = [
      currentLocale, // Highest priority
    ]

    // Add other supported languages with lower quality
    const otherLanguages = I18N_CONFIG.supportedLanguages.filter(
      (lang) => lang !== currentLocale
    )
    otherLanguages.forEach((lang) => {
      languages.push({ language: lang, quality: 0.8 })
    })

    return languages
      .map((lang) => {
        if (typeof lang === 'string') {
          return lang
        }
        return `${lang.language};q=${lang.quality}`
      })
      .join(', ')
  }
}
