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

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinProductDetails(
  faker: Faker,
  variantId?: string
): ProductDetailsResponse {
  const name = faker.commerce.productName()
  const colors = createShopinColorOptions(faker)
  const sizes = createShopinSizeOptions(faker)
  const styles = createShopinStyleOptions(faker, name)
  const variants = createShopinProductVariants(faker, colors, sizes, styles)
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
