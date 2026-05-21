import type { BasicPriceResponse } from '@core/contracts/core/basic-price'

export interface CreateBasicPriceOptions {
  currency: string
  discountedPriceInCents?: number
  recommendedRetailPriceInCents?: number
  omnibusPriceInCents?: number
  fractionDigits?: number
}

export function createBasicPrice(
  regularPriceInCents: number | undefined,
  options: CreateBasicPriceOptions
): BasicPriceResponse | undefined {
  if (regularPriceInCents === undefined) {
    return undefined
  }

  return {
    regularPriceInCents,
    currency: options.currency,
    fractionDigits: options.fractionDigits ?? 2,
    ...(options.discountedPriceInCents !== undefined && {
      discountedPriceInCents: options.discountedPriceInCents,
    }),
    ...(options.recommendedRetailPriceInCents !== undefined && {
      recommendedRetailPriceInCents: options.recommendedRetailPriceInCents,
    }),
    ...(options.omnibusPriceInCents !== undefined && {
      omnibusPriceInCents: options.omnibusPriceInCents,
    }),
  }
}
