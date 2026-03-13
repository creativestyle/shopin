import type { MockApi } from '../client/client.module'
import type { ProductGalleryResponse } from '@core/contracts/product/product-gallery'

type Faker = ReturnType<MockApi['getFaker']>

export function createShopinProductGallery(
  faker: Faker,
  name: string,
  variantId?: string
): ProductGalleryResponse {
  const generate = () => '/images/product-image.png'
  const baseImages = faker.helpers.multiple(
    () => ({ src: generate(), alt: name }),
    { count: { min: 2, max: 6 } }
  )
  const vIdx = variantId ? Number(variantId) - 1 : -1
  const images =
    vIdx >= 0
      ? [
          {
            src: `${generate()}?variant=${vIdx + 1}`,
            alt: `${name} variant ${vIdx + 1}`,
          },
          ...baseImages,
        ]
      : baseImages
  return { images }
}
