import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'

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
  language: string,
  langKey: string
): ProductCardResponse {
  const nameAttr = `name_${langKey}`
  const pricePrefix = `price_${langKey}`
  const slug = hit.slug as Record<string, string> | undefined
  const slugStr =
    (slug && typeof slug === 'object' ? slug[language] : undefined) ||
    hit.objectID

  return {
    id: hit.objectID,
    name: (hit[nameAttr] as string) || 'Unnamed Product',
    slug: slugStr,
    image: {
      src: (hit.imageUrl as string) || '/images/product-image.png',
      alt: (hit.imageAlt as string) || 'Product image',
    },
    price: {
      regularPriceInCents: (hit[`${pricePrefix}_centAmount`] as number) || 0,
      ...(hit[`${pricePrefix}_currency`] != null && {
        currency: hit[`${pricePrefix}_currency`] as string,
      }),
      fractionDigits: (hit[`${pricePrefix}_fractionDigits`] as number) ?? 2,
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
    variantId: (hit.variantId as string) || '1',
    variantCount: (hit.variantCount as number) || 1,
  }
}
