/**
 * Contentful Images API: URL builder for assets from hostnames configured in
 * @config/constants (content-image). Used when a single URL with params is needed (e.g. server-side).
 * Presentation uses next/image with its own loader; integrations pass base URL only.
 *
 * @see https://www.contentful.com/developers/docs/references/images-api/
 */

import {
  CONTENT_IMAGE_API_HOSTS,
  CONTENT_IMAGE_DEFAULT_QUALITY,
} from '@config/constants'

export type ContentfulImageLoaderParams = {
  src: string
  width: number
  quality?: number
}

export function contentfulHostSupportsImageApi(url: string): boolean {
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

/**
 * Builds a Contentful Images API URL with width, quality, and format (WebP).
 */
export function contentfulImageLoader({
  src,
  width,
  quality = CONTENT_IMAGE_DEFAULT_QUALITY,
}: ContentfulImageLoaderParams): string {
  if (!src || !contentfulHostSupportsImageApi(src)) {
    return src
  }
  const separator = src.includes('?') ? '&' : '?'
  const params = new URLSearchParams()
  params.set('w', String(Math.round(width)))
  params.set('q', String(quality))
  params.set('fm', 'webp')
  return `${src}${separator}${params.toString()}`
}
