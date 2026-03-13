import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type { MockApi } from '../client/client.module'
import { createShopinBasicPrice } from './shopin-basic-price'

type Faker = ReturnType<MockApi['getFaker']>

// Possible attribute values for mock products
// Using commercetools format "Label:#hexcode" for colors
const COLORS = [
  'Red:#FF0000',
  'Blue:#0000FF',
  'Black:#000000',
  'White:#FFFFFF',
  'Green:#008000',
  'Yellow:#FFFF00',
  'Pink:#FFC0CB',
  'Gray:#808080',
]
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const MATERIALS = ['Cotton', 'Polyester', 'Leather', 'Wool', 'Silk', 'Denim']
const BRANDS = [
  'Nike',
  'Adidas',
  'Puma',
  'Reebok',
  'Under Armour',
  'New Balance',
]

export interface MockProductAttributes {
  color: string
  size: string
  material: string
  brand: string
}

export interface ProductCardWithAttributes extends ProductCardResponse {
  attributes: MockProductAttributes
}

export function createShopinProductCardList(
  faker: Faker,
  count: number = 16
): ProductCardWithAttributes[] {
  return faker.helpers.multiple(
    () => {
      const name = faker.commerce.productName()
      const price = createShopinBasicPrice(faker)

      return {
        id: faker.string.uuid(),
        slug: faker.helpers.slugify(name).toLocaleLowerCase(),
        name,
        price,
        image: { src: '/images/product-image.png', alt: name },
        attributes: {
          color: faker.helpers.arrayElement(COLORS),
          size: faker.helpers.arrayElement(SIZES),
          material: faker.helpers.arrayElement(MATERIALS),
          brand: faker.helpers.arrayElement(BRANDS),
        },
      }
    },
    { count }
  )
}
