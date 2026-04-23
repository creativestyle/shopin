import { getLocale } from '@config/constants'

/** Resolves the currency code for a given RFC 5646 language tag. */
export function resolveCurrencyFromLanguage(language: string): string {
  return getLocale(language).currency
}
