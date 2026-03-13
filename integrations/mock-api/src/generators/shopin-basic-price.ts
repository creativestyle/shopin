import type { MockApi } from '../client/client.module'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinBasicPrice(faker: Faker): BasicPriceResponse {
  const basePriceMajor = parseFloat(faker.commerce.price({ min: 50, max: 400 }))
  const fractionDigits = 2
  const currency = 'EUR'
  const basePriceMinor = Math.round(basePriceMajor * 10 ** fractionDigits)

  const hasDiscount = faker.helpers.maybe(() => true, { probability: 0.6 })
  const discountPct = faker.number.int({ min: 5, max: 30 })
  const discountedPriceInCents = hasDiscount
    ? Math.round(basePriceMinor * (1 - discountPct / 100))
    : undefined

  const recommendedRetailPriceInCents = faker.helpers.maybe(
    () =>
      Math.round(basePriceMinor * faker.number.float({ min: 1.05, max: 1.25 })),
    { probability: 0.6 }
  )

  const omnibusPriceInCents = hasDiscount
    ? Math.min(
        basePriceMinor,
        discountedPriceInCents as number,
        Math.round(basePriceMinor * faker.number.float({ min: 0.7, max: 0.95 }))
      )
    : undefined

  return {
    regularPriceInCents: basePriceMinor,
    ...(discountedPriceInCents !== undefined ? { discountedPriceInCents } : {}),
    fractionDigits,
    currency,
    ...(recommendedRetailPriceInCents !== undefined
      ? { recommendedRetailPriceInCents }
      : {}),
    ...(omnibusPriceInCents !== undefined ? { omnibusPriceInCents } : {}),
  }
}
