import type { BasicPriceResponse } from '@core/contracts/core/basic-price'

export interface CreateBasicPriceOptions {
  currency?: string
  discountedPriceInCents?: number
  recommendedRetailPriceInCents?: number
  omnibusPriceInCents?: number
  fractionDigits?: number
}

/**
 * Creates a BasicPriceResponse object with standard fraction digits.
 * Returns undefined if the amount is undefined (useful for optional price fields).
 *
 * @param regularPriceInCents - The price amount in cents (can be undefined)
 * @param options - Optional configuration for the price object
 * @returns A BasicPriceResponse object, or undefined if amount is not provided
 */
export function createBasicPrice(
  regularPriceInCents: number | undefined,
  options?: CreateBasicPriceOptions
): BasicPriceResponse | undefined {
  if (regularPriceInCents === undefined) {
    return undefined
  }

  const opts = options || {}

  return {
    regularPriceInCents,
    fractionDigits: opts.fractionDigits ?? 2,
    ...(opts.currency && { currency: opts.currency }),
    ...(opts.discountedPriceInCents !== undefined && {
      discountedPriceInCents: opts.discountedPriceInCents,
    }),
    ...(opts.recommendedRetailPriceInCents !== undefined && {
      recommendedRetailPriceInCents: opts.recommendedRetailPriceInCents,
    }),
    ...(opts.omnibusPriceInCents !== undefined && {
      omnibusPriceInCents: opts.omnibusPriceInCents,
    }),
  }
}
