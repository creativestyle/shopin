import type { MockApi } from '../../client/client.module'
import type { ColorOptionItemResponse } from '@core/contracts/product/option-item'

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinColorOptions(
  faker: Faker
): ColorOptionItemResponse[] {
  const desiredCount = faker.number.int({ min: 2, max: 5 })
  const uniqueByLabel = new Map<string, ColorOptionItemResponse>()
  let attempts = 0
  while (uniqueByLabel.size < desiredCount && attempts < desiredCount * 10) {
    const label = faker.color.human()
    if (!uniqueByLabel.has(label)) {
      const swatch = faker.color.rgb({ prefix: '#' })
      uniqueByLabel.set(label, { label, swatch })
    }
    attempts++
  }
  return Array.from(uniqueByLabel.values())
}

export function createShopinColorSwatchesFromColorOptions(
  colorOptions: ColorOptionItemResponse[],
  maxVisible: number = 3
): { colors: string[]; additionalCount: number } {
  const colors = colorOptions.map((c) => c.swatch)
  return {
    colors: colors.slice(0, maxVisible),
    additionalCount: Math.max(0, colors.length - maxVisible),
  }
}
