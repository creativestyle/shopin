// Main export file for @core/i18n module
export type { TranslationValue, Translations } from './types'
export { AcceptLanguageUtils } from './accept-language-utils'
export { LanguageTagUtils } from './language-tag-utils'
export { resolveCurrencyFromLanguage } from './currency-utils'
export { getLocalizedString } from './localized-string-utils'

// Header constants
export const LANGUAGE_HEADER = 'accept-language'
export const LANGUAGE_TOKEN = 'LANGUAGE_TOKEN'

// Request interfaces
import type { SupportedLocale } from '@config/constants'

export interface LanguageRequest {
  language: SupportedLocale
  headers: Record<string, string | string[] | undefined>
}
