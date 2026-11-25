import type { MockApi } from '../../client/client.module'
import type { ImageOptionItemResponse } from '@core/contracts/product/option-item'

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinStyleOptions(
  faker: Faker,
  name: string
): ImageOptionItemResponse[] {
  const count = faker.number.int({ min: 2, max: 3 })
  return Array.from({ length: count }, (_, i) => ({
    label: `${name} ${i + 1}`,
    imageSrc: '/images/product-image.png',
  }))
}
