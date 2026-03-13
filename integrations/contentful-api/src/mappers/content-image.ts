import type { ContentImage } from '@core/contracts/content/content-image'
import type { ContentfulImageApiResponse } from '../schemas/image'

/**
 * Maps Contentful Asset fields to contract ContentImage.
 * Contentful has no "alt" field; we derive it from title (and description when requested) so the contract always has alt.
 * Passes the base asset URL; presentation uses next/image with a loader to build responsive URLs.
 * Returns undefined when url is missing.
 */
export function mapContentfulImageToContentImage(
  asset: ContentfulImageApiResponse
): ContentImage | undefined {
  const url = asset?.url?.trim()
  if (!url) {
    return undefined
  }
  const alt = (asset?.title ?? asset?.description ?? '').trim() || ''
  return {
    url,
    alt,
    title: asset?.title ?? undefined,
    width: asset?.width ?? undefined,
    height: asset?.height ?? undefined,
  }
}
