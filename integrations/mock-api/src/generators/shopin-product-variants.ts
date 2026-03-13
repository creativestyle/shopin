import type { MockApi } from '../client/client.module'
import type {
  ColorOptionItemResponse,
  ImageOptionItemResponse,
  ValueOptionItemResponse,
} from '@core/contracts/product/option-item'

type Faker = ReturnType<MockApi['getFaker']>

type Variant = { id: string; attributes: Record<string, string> }

function buildAllVariantCombinations(
  colors: ColorOptionItemResponse[],
  sizes: ValueOptionItemResponse[],
  styles: ImageOptionItemResponse[]
): Variant[] {
  return colors.flatMap((color, colorIndex) =>
    sizes.flatMap((size, sizeIndex) =>
      styles.map((style, styleIndex) => ({
        id: String(
          colorIndex * sizes.length * styles.length +
            sizeIndex * styles.length +
            styleIndex +
            1
        ),
        attributes: {
          color: color.label,
          size: size.label,
          style: style.label,
        },
      }))
    )
  )
}

function groupByColor(variants: Variant[]): Map<string, Variant[]> {
  const byColor = new Map<string, Variant[]>()
  variants.forEach((variant) => {
    const key = variant.attributes.color
    const arr = byColor.get(key) || []
    arr.push(variant)
    byColor.set(key, arr)
  })
  return byColor
}

function chooseVariantsPerColor(
  faker: Faker,
  grouped: Map<string, Variant[]>
): Variant[] {
  // Keep at least one variant per color so every color remains available
  // in the mock data. Then randomly keep some additional variants to
  // simulate that not all size/style combinations exist for each color.
  // This produces realistic, sparse variant availability while preserving
  // coverage across colors.
  return Array.from(grouped.values()).flatMap((arr) => {
    const keep: Variant[] = [arr[0]]
    for (let i = 1; i < arr.length; i++) {
      if (faker.number.int({ min: 0, max: 1 }) === 1) {
        keep.push(arr[i])
      }
    }
    return keep
  })
}

export function createShopinProductVariants(
  faker: Faker,
  colors: ColorOptionItemResponse[],
  sizes: ValueOptionItemResponse[],
  styles: ImageOptionItemResponse[]
): Array<{ id: string; attributes: Record<string, string> }> {
  const all = buildAllVariantCombinations(colors, sizes, styles)
  const grouped = groupByColor(all)
  return chooseVariantsPerColor(faker, grouped)
}
