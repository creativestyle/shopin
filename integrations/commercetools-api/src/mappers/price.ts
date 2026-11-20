import type { ProductVariantApiResponse } from '../schemas/product-variant'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'
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
 * Maps the price commercetools selected for the store to the shopin price.
 *
 * `variant.price` is set only when the query sends `priceCurrency`/`priceCountry`
 * (Price Selection). commercetools then picks the one price that applies to every
 * shopper today; when it picks none, the remaining prices are scoped to a customer
 * group or channel, outside their validity window, or in another currency, so none
 * of them is shown. Returns undefined in that case: the product is not sellable in
 * that store, so no amount is shown (never a zero or a foreign-currency amount).
 */
export function mapVariantPriceToShopin(
  variant: ProductVariantApiResponse
): BasicPriceResponse | undefined {
  const selectedPrice = variant.price
  if (!selectedPrice) {
    return undefined
  }

  const regularPriceInCents = selectedPrice.value.centAmount
  const discountedPriceInCents = selectedPrice.discounted?.value.centAmount
  const currency = selectedPrice.value.currencyCode

  const fields = selectedPrice.custom?.fields
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
