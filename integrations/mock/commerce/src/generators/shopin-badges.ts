import type { MockApi } from '../client/client.module'
import type { BadgeResponse } from '@core/contracts/core/badge'
import type { BasicPriceResponse } from '@core/contracts/core/basic-price'

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinBadges(
  faker: Faker,
  price: BasicPriceResponse
): BadgeResponse[] | undefined {
  if (
    price.discountedPriceInCents !== undefined &&
    price.regularPriceInCents > 0
  ) {
    const pct = Math.round(
      (1 - price.discountedPriceInCents / price.regularPriceInCents) * 100
    )
    const maybeNew =
      faker.helpers.maybe(() => ({ variant: 'blue' as const, text: 'NEW' }), {
        probability: 0.5,
      }) || undefined
    return [{ variant: 'red' as const, text: `-${pct}%` }, maybeNew].filter(
      Boolean
    ) as BadgeResponse[]
  }

  return faker.helpers.maybe(
    () => [{ variant: 'blue' as const, text: 'NEW' }],
    { probability: 0.4 }
  )
}
