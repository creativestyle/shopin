/**
 * Next.js Image loader for commercetools product images.
 * Transforms CDN URLs to use pre-generated size variants via filename suffix.
 * @see https://nextjs.org/docs/app/api-reference/components/image#loader
 * @see https://docs.commercetools.com/api/projects/products#image
 */

import { PRODUCT_IMAGE_HOSTS } from '@config/constants'
import { isHostSupported } from './image-host-utils'

const SIZE_BREAKPOINTS = [
  { maxWidth: 50, suffix: '-thumb' },
  { maxWidth: 150, suffix: '-small' },
  { maxWidth: 400, suffix: '-medium' },
  { maxWidth: 700, suffix: '-large' },
] as const

type ProductImageLoaderParams = {
  src: string
  width: number
}

function getSizeSuffix(width: number): string {
  for (const { maxWidth, suffix } of SIZE_BREAKPOINTS) {
    if (width <= maxWidth) {
      return suffix
    }
  }
  return '-zoom'
}

function buildProductImageUrl({
  src,
  width,
}: ProductImageLoaderParams): string {
  const suffix = getSizeSuffix(width)
  // Captures extension, optional query string, and optional fragment separately
  // so each is preserved after suffix insertion. No-op for extensionless URLs.
  return src.replace(/(\.[^./?#]+)(\?[^#]*)?(#.*)?$/, `${suffix}$1$2$3`)
}

export function productImageLoader(
  src: string
): typeof buildProductImageUrl | undefined {
  return isHostSupported(src, PRODUCT_IMAGE_HOSTS)
    ? buildProductImageUrl
    : undefined
}
