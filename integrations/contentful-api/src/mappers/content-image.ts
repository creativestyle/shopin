import type { ContentImage } from '@core/contracts/content/content-image'
import type { ContentfulImageApiResponse } from '../schemas/image'

/**
 * Maps Contentful Asset fields to contract ContentImage.
 * Contentful has no "alt" field; description is the editorial alt text, title is the (auto-filled) asset name.
 * Prefer description, fall back to title; empty description falls through, and a cleared title yields alt='' (decorative).
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
  const alt = (asset?.description || asset?.title || '').trim()
  return {
    url,
    alt,
    title: asset?.title ?? undefined,
    width: asset?.width ?? undefined,
    height: asset?.height ?? undefined,
  }
}
