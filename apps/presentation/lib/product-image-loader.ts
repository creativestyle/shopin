/**
 * Next.js Image loader for commercetools product images.
 * Transforms CDN URLs to use pre-generated size variants via filename suffix.
 * @see https://nextjs.org/docs/app/api-reference/components/image#loader
 * @see https://docs.commercetools.com/api/projects/products#image
 */

import { PRODUCT_IMAGE_HOSTS } from '@config/constants'

const SIZE_BREAKPOINTS = [
  { maxWidth: 50, suffix: '-thumb' },
  { maxWidth: 150, suffix: '-small' },
  { maxWidth: 400, suffix: '-medium' },
  { maxWidth: 700, suffix: '-large' },
] as const

export type ProductImageLoaderParams = {
  src: string
  width: number
}

function productHostSupported(url: string): boolean {
  try {
    const absolute = url.startsWith('//') ? `https:${url}` : url
    const host = new URL(absolute).hostname
    return PRODUCT_IMAGE_HOSTS.some((h) => host === h || host.endsWith('.' + h))
  } catch {
    return false
  }
}

function getSizeSuffix(width: number): string {
  for (const { maxWidth, suffix } of SIZE_BREAKPOINTS) {
    if (width <= maxWidth) {
      return suffix
    }
  }
  return '-zoom'
}

export function productImageLoader({
  src,
  width,
}: ProductImageLoaderParams): string {
  if (!src || !productHostSupported(src)) {
    return src
  }
  const suffix = getSizeSuffix(width)
  return src.replace(/(\.[^./?#]+)(\?.*)?$/, `${suffix}$1$2`)
}
