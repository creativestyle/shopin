import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { buildAlgoliaFieldNames } from './algolia-filters'

const DEFAULT_PRODUCT_NAME = 'Unnamed Product'
const DEFAULT_IMAGE_SRC = '/images/product-image.png'
const DEFAULT_IMAGE_ALT = 'Product image'
const DEFAULT_FRACTION_DIGITS = 2

export interface AlgoliaProductHit {
  objectID: string
  name_en_US?: string
  name_de_DE?: string
  slug?: Record<string, string>
  variantId?: string
  variantCount?: number
  imageUrl?: string
  imageAlt?: string
  [key: string]: unknown
}

export function mapAlgoliaHitToProduct(
  hit: AlgoliaProductHit,
  language: string
): ProductCardResponse {
  const { langKey } = buildAlgoliaFieldNames(language)
  const nameAttr = `name_${langKey}`
  const pricePrefix = `price_${langKey}`
  const slugStr = hit.slug?.[language] ?? hit.objectID

  return {
    id: hit.objectID,
    name: (hit[nameAttr] as string) || DEFAULT_PRODUCT_NAME,
    slug: slugStr,
    image: {
      src: (hit.imageUrl as string) || DEFAULT_IMAGE_SRC,
      alt: (hit.imageAlt as string) || DEFAULT_IMAGE_ALT,
    },
    price: {
      regularPriceInCents: (hit[`${pricePrefix}_centAmount`] as number) || 0,
      ...(hit[`${pricePrefix}_currency`] != null && {
        currency: hit[`${pricePrefix}_currency`] as string,
      }),
      fractionDigits:
        (hit[`${pricePrefix}_fractionDigits`] as number) ??
        DEFAULT_FRACTION_DIGITS,
      ...(hit[`${pricePrefix}_discountedCentAmount`] != null && {
        discountedPriceInCents: hit[
          `${pricePrefix}_discountedCentAmount`
        ] as number,
      }),
      ...(hit[`${pricePrefix}_rrpCentAmount`] != null && {
        recommendedRetailPriceInCents: hit[
          `${pricePrefix}_rrpCentAmount`
        ] as number,
      }),
      ...(hit[`${pricePrefix}_omnibusCentAmount`] != null && {
        omnibusPriceInCents: hit[`${pricePrefix}_omnibusCentAmount`] as number,
      }),
    },
    variantId: hit.variantId,
    variantCount: hit.variantCount,
  }
}
