/**
 * Next.js Image loader for content/CMS images. The serving CMS integration declares its image hosts and
 * how they resize (shopin.config.ts → STOREFRONT); this file knows no vendor URL scheme.
 *
 * @see https://nextjs.org/docs/app/api-reference/components/image#loader
 */

import { CONTENT_IMAGE_DEFAULT_QUALITY } from '@config/constants'
import { imageSourceOf, resizeImage } from '@/lib/image-source'
import { STOREFRONT } from '@/lib/storefront-config'

export type ContentImageLoaderParams = {
  src: string
  width: number
  quality?: number
}

/** The URL at this width by the serving CMS's resize rule; `src` unchanged for any other host. */
export function contentImageLoader({
  src,
  width,
  quality = CONTENT_IMAGE_DEFAULT_QUALITY,
}: ContentImageLoaderParams): string {
  const source = src ? imageSourceOf(src, STOREFRONT.contentImages) : undefined
  return source ? resizeImage(src, width, quality, source) : src
}
