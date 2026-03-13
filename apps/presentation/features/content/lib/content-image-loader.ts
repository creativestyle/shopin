/**
 * Next.js Image loader for content/CMS images (e.g. Contentful Images API).
 * Builds URLs with width/quality/format so integrations only pass a single base URL;
 * next/image calls this with (src, width, quality) and uses the returned URL.
 *
 * @see https://nextjs.org/docs/app/api-reference/components/image#loader
 * @see https://www.contentful.com/developers/docs/references/images-api/
 */

import {
  CONTENT_IMAGE_API_HOSTS,
  CONTENT_IMAGE_DEFAULT_QUALITY,
} from '@config/constants'

function contentHostSupportsImageApi(url: string): boolean {
  try {
    const absolute = url.startsWith('//') ? `https:${url}` : url
    const host = new URL(absolute).hostname
    return CONTENT_IMAGE_API_HOSTS.some(
      (h) => host === h || host.endsWith('.' + h)
    )
  } catch {
    return false
  }
}

export type ContentImageLoaderParams = {
  src: string
  width: number
  quality?: number
}

/**
 * Loader for next/image. Returns URL with w, q, fm=webp for content image hosts;
 * returns src unchanged for other URLs.
 */
export function contentImageLoader({
  src,
  width,
  quality = CONTENT_IMAGE_DEFAULT_QUALITY,
}: ContentImageLoaderParams): string {
  if (!src || !contentHostSupportsImageApi(src)) {
    return src
  }
  const separator = src.includes('?') ? '&' : '?'
  const params = new URLSearchParams()
  params.set('w', String(Math.round(width)))
  params.set('q', String(quality))
  params.set('fm', 'webp')
  return `${src}${separator}${params.toString()}`
}
