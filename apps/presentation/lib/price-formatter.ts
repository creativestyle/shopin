import { urlPrefixToRfc } from '@config/constants'

/**
 * Formats a price from cents using Intl.NumberFormat
 * @param priceInCents - Price in cents (e.g., 1599 for €15.99)
 * @param locale - RFC 5646 locale (e.g., 'de-DE', 'en-US')
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPrice(
  priceInCents: number,
  locale: string,
  options?: {
    currency?: string
    fractionDigits?: number
    style?: 'decimal' | 'currency'
  }
): string {
  const { currency = 'EUR', fractionDigits, style = 'currency' } = options ?? {}

  const price = priceInCents / 100

  const formatter = new Intl.NumberFormat(locale, {
    style,
    currency: style === 'currency' ? currency : undefined,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  return formatter.format(price)
}

/**
 * Formats a price using URL prefix (converts to RFC locale internally)
 * @param priceInCents - Price in cents
 * @param urlPrefix - URL prefix like 'de', 'en'
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatPriceWithPrefix(
  priceInCents: number,
  urlPrefix: string,
  options?: {
    currency?: string
    fractionDigits?: number
    style?: 'decimal' | 'currency'
  }
): string {
  const rfcLocale = urlPrefixToRfc(urlPrefix)
  return formatPrice(priceInCents, rfcLocale, options)
}
