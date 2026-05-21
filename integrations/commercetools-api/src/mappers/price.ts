import type { ProductVariantApiResponse } from '../schemas/product-variant'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'
import { LanguageTagUtils, resolveCurrencyFromLanguage } from '@core/i18n'
import { I18N_CONFIG } from '@config/constants'
import { createBasicPrice } from '../helpers/create-basic-price'

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
  const omnibusPriceInCents =
    fields && typeof fields.omnibusPrice === 'number'
      ? fields.omnibusPrice
      : undefined

  return createBasicPrice(regularPriceInCents, {
    currency,
    discountedPriceInCents,
    recommendedRetailPriceInCents,
    omnibusPriceInCents,
  })!
}
