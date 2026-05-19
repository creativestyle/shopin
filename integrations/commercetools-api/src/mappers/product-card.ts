import type { ProductProjectionApiResponse } from '../schemas/product-projection'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { mapVariantPriceToShopin } from './price'
import { mapBadges } from './badges'

export function mapProductToCard(
  product: ProductProjectionApiResponse,
  currentLanguage: string
): ProductCardResponse {
  const masterVariant = product.masterVariant
  const variantCount = 1 + (product.variants?.length || 0)
  const price = mapVariantPriceToShopin(masterVariant, currentLanguage)

  return {
    id: product.id,
    name: mapLocalized(product.name, currentLanguage) || 'Unnamed Product',
    slug: mapLocalized(product.slug, currentLanguage) || product.id,
    image: {
      src: masterVariant.images?.[0]?.url || '/images/product-image.png',
      alt: masterVariant.images?.[0]?.label || 'Product image',
    },
    price,
    badges: mapBadges(
      price.regularPriceInCents,
      price.discountedPriceInCents,
      product.createdAt
    ),
    variantId: String(masterVariant.id),
    variantCount,
  }
}
