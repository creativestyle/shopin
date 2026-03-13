import type { ProductProjectionApiResponse } from '../schemas/product-projection'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import { getLocalizedString as mapLocalized } from '../helpers/get-localized-string'
import { mapVariantPriceToShopin } from './price'

export function mapProductToCard(
  product: ProductProjectionApiResponse,
  currentLanguage: string
): ProductCardResponse {
  const masterVariant = product.masterVariant
  // Total variant count: master variant (not included in variants array) + additional variants
  const variantCount = 1 + (product.variants?.length || 0)

  return {
    id: product.id,
    name: mapLocalized(product.name, currentLanguage) || 'Unnamed Product',
    slug: mapLocalized(product.slug, currentLanguage) || product.id,
    image: {
      src: masterVariant.images?.[0]?.url || '/images/product-image.png',
      alt: masterVariant.images?.[0]?.label || 'Product image',
    },
    price: mapVariantPriceToShopin(masterVariant, currentLanguage),
    variantId: String(masterVariant.id),
    variantCount,
  }
}
