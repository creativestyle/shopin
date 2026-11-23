import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import type { MockApi } from '../client/client.module'
import { createShopinBasicPrice } from './shopin-basic-price'
import { createShopinConfigurableOptions } from './shopin-configurable-options'
import { createShopinColorOptions } from './configurable/shopin-color-options'
import { createShopinSizeOptions } from './configurable/shopin-size-options'
import { createShopinStyleOptions } from './configurable/shopin-style-options'
import { createShopinProductGallery } from './shopin-product-gallery'
import { createShopinProductVariants } from './shopin-product-variants'
import { createShopinBadges } from './shopin-badges'
import { generateSeed } from '../helpers/generateSeed'

type Faker = ReturnType<MockApi['getFaker']>

function createShopinVariantSet(faker: Faker) {
  const name = faker.commerce.productName()
  const colors = createShopinColorOptions(faker)
  const sizes = createShopinSizeOptions(faker)
  const styles = createShopinStyleOptions(faker, name)
  const variants = createShopinProductVariants(faker, colors, sizes, styles)
  return { name, colors, sizes, styles, variants }
}

/** Seeds faker by slug like the mock ProductService, so cards match the PDP. */
export function getShopinProductVariantSummary(
  faker: Faker,
  slug: string
): { variantId: string; variantCount: number } {
  faker.seed(generateSeed(slug))
  const { variants } = createShopinVariantSet(faker)
  return { variantId: variants[0].id, variantCount: variants.length }
}

export function createShopinProductDetails(
  faker: Faker,
  variantId?: string
): ProductDetailsResponse {
  const { name, colors, sizes, styles, variants } =
    createShopinVariantSet(faker)
  const gallery = createShopinProductGallery(faker, name, variantId)
  const price = createShopinBasicPrice(faker)

  return {
    id: faker.string.uuid(),
    slug: faker.helpers.slugify(name).toLocaleLowerCase(),
    name,
    description: faker.commerce.productDescription(),
    seoText: faker.lorem.paragraphs(2),
    price,
    gallery,
    badges: createShopinBadges(faker, price),
    deliveryEstimate: 'Delivered in 2-3 working days',
    configurableOptions: createShopinConfigurableOptions(colors, sizes, styles),
    variants,
  }
}
