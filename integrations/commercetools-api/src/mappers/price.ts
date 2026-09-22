import type { ProductVariantApiResponse } from '../schemas/product-variant'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'
import { LanguageTagUtils, resolveCurrencyFromLanguage } from '@core/i18n'
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

export function mapVariantPriceToShopin(
  variant: ProductVariantApiResponse,
  currentLanguage?: string
): BasicPriceResponse {
  const prices = variant.prices ?? []
  const preferredCountry = currentLanguage
    ? LanguageTagUtils.getCountry(currentLanguage)
    : undefined

  const selectedPrice =
    prices.find((p) => p.country === preferredCountry) ?? prices[0]

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
