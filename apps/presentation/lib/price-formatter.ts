import { urlPrefixToRfc } from '@config/constants'

interface FormatPriceOptions {
  currency: string
  fractionDigits?: number
}

export function formatPrice(
  priceInCents: number,
  locale: string,
  options: FormatPriceOptions
): string {
  const { currency, fractionDigits } = options
  const price = priceInCents / 100

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  return formatter.format(price)
}

export function formatPriceWithPrefix(
  priceInCents: number,
  urlPrefix: string,
  options: FormatPriceOptions
): string {
  return formatPrice(priceInCents, urlPrefixToRfc(urlPrefix), options)
}
