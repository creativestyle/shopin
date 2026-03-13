import type { ProductVariantApiResponse } from '../schemas/product-variant'
import type { ProductGalleryResponse } from '@core/contracts/product/product-gallery'

export function mapVariantToGallery(
  variant: ProductVariantApiResponse
): ProductGalleryResponse {
  const images = (variant.images || []).map((image, index) => ({
    src: image.url,
    alt: image.label || `Product image ${index + 1}`,
  }))
  return { images }
}
