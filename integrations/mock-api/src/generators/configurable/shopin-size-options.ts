import type { MockApi } from '../../client/client.module'
import type { ValueOptionItemResponse } from '@core/contracts/product/option-item'

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinSizeOptions(
  faker: Faker
): ValueOptionItemResponse[] {
  const count = faker.number.int({ min: 3, max: 6 })
  const set = new Set<number>()
  while (set.size < count) {
    set.add(faker.number.int({ min: 32, max: 48 }))
  }
  return Array.from(set)
    .sort((a, b) => a - b)
    .map((n) => {
      const s = String(n)
      return { label: s }
    })
}
