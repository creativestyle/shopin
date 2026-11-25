import type { ProductVariantApiResponse } from '../schemas/product-variant'
import type { ProductGalleryResponse } from '@core/contracts/product/product-gallery'

export function mapVariantToGallery(
  variant: ProductVariantApiResponse,
  productName?: string
): ProductGalleryResponse {
  const images = (variant.images || []).map((image, index) => ({
    src: image.url,
    alt:
      image.label ||
      (productName
        ? `${productName} ${index + 1}`
        : `Product image ${index + 1}`),
  }))
  return { images }
}
