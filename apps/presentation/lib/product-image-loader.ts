/**
 * Next.js Image loader for product images. The serving commerce integration declares its image hosts and
 * how they resize (shopin.config.ts → STOREFRONT); this file knows no vendor URL scheme.
 * @see https://nextjs.org/docs/app/api-reference/components/image#loader
 */

import { imageSourceOf, resizeImage } from '@/lib/image-source'
import { STOREFRONT } from './storefront-config'

type ProductImageLoaderParams = {
  src: string
  width: number
  quality?: number
}

export function productImageLoader(
  src: string
): ((params: ProductImageLoaderParams) => string) | undefined {
  const source = imageSourceOf(src, STOREFRONT.productImages)
  return source?.resize
    ? ({ src, width, quality = 75 }: ProductImageLoaderParams) =>
        resizeImage(src, width, quality, source)
    : undefined
}
