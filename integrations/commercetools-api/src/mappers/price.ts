import type { ProductVariantApiResponse } from '../schemas/product-variant'
import type { PriceApiResponse } from '../schemas/price'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'
import { resolveCurrencyFromLanguage } from '@core/i18n/currency-utils'
import { resolveCountryFromLanguage } from '@core/i18n/language-tag-utils'
import { I18N_CONFIG } from '@config/constants'
import { createBasicPrice } from '../helpers/create-basic-price'

interface MoneyAttributeValue {
  currencyCode: string
  centAmount: number
}

function isMoneyAttributeValue(value: unknown): value is MoneyAttributeValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { centAmount?: unknown }).centAmount === 'number' &&
    typeof (value as { currencyCode?: unknown }).currencyCode === 'string'
  )
}

/**
 * Picks the variant price for the store resolved from the language.
 *
 * Prefers `variant.price`, the price commercetools selects when the query sends
 * `priceCurrency`/`priceCountry`. Without it, falls back to a price in the store's
 * currency for its country, then to one in that currency without a country. A price
 * in another currency is never returned.
 */
export function selectVariantPrice(
  variant: ProductVariantApiResponse,
  currentLanguage: string = I18N_CONFIG.defaultLocale
): PriceApiResponse | undefined {
  if (variant.price) {
    return variant.price
  }
  const currency = resolveCurrencyFromLanguage(currentLanguage)
  const country = resolveCountryFromLanguage(currentLanguage)
  const inCurrency = (variant.prices ?? []).filter(
    (price) => price.value.currencyCode === currency
  )
  return (
    inCurrency.find((price) => price.country === country) ??
    inCurrency.find((price) => price.country === undefined)
  )
}

export function mapVariantPriceToShopin(
  variant: ProductVariantApiResponse,
  currentLanguage?: string
): BasicPriceResponse {
  const selectedPrice = selectVariantPrice(variant, currentLanguage)

  const regularPriceInCents = selectedPrice?.value.centAmount ?? 0
  const discountedPriceInCents = selectedPrice?.discounted?.value.centAmount
  const currency =
    selectedPrice?.value.currencyCode ??
    resolveCurrencyFromLanguage(currentLanguage ?? I18N_CONFIG.defaultLocale)

  const fields = selectedPrice?.custom?.fields
  const recommendedRetailPriceInCents =
    fields && typeof fields.recommendedRetailPrice === 'number'
      ? fields.recommendedRetailPrice
      : undefined

  // Lowest price in the last 30 days (EU Omnibus). Sourced from a per-currency
  // variant attribute `30_day_price_<CURRENCY>` — a commercetools `money` value.
  const historicalPriceAttribute = (variant.attributes ?? []).find(
    (attribute) => attribute.name === `30_day_price_${currency}`
  )
  const omnibusPriceInCents =
    historicalPriceAttribute &&
    isMoneyAttributeValue(historicalPriceAttribute.value)
      ? historicalPriceAttribute.value.centAmount
      : undefined

  return createBasicPrice(regularPriceInCents, {
    currency,
    discountedPriceInCents,
    recommendedRetailPriceInCents,
    omnibusPriceInCents,
  })!
}
