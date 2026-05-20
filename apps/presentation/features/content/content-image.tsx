'use client'

import Image from 'next/image'
import type { ContentImage } from '@core/contracts/content/content-image'
import { contentImageLoader } from './lib/content-image-loader'
import { cn } from '@/lib/utils'

type Props = {
  image: ContentImage
  fill?: boolean
  className?: string
  sizes?: string
  preload?: boolean
}

/**
 * Renders a content image from the contract (url, alt, width, height).
 * Uses next/image with a loader that builds URLs (e.g. Contentful w/q/fm);
 * integrations pass a single base URL. Next.js calls the loader per width for srcset.
 *
 * When `preload` is true, Next 16's `preload` prop is forwarded, which injects a
 * `<link rel="preload">` into `<head>`, and `fetchPriority="high"` is set on the
 * rendered img element (required for Lighthouse LCP audits).
 */
export function ContentImage({
  image,
  fill = true,
  className,
  sizes,
  preload,
}: Props) {
  const url = image.url?.trim()
  if (!url) {
    return null
  }

  const width = image.width
  const height = image.height
  const useFill = fill || width == null || height == null

  return (
    <Image
      loader={contentImageLoader}
      src={url}
      alt={image.alt}
      sizes={sizes}
      className={cn({ 'object-cover': useFill }, className)}
      {...(useFill ? { fill: true } : { width: width!, height: height! })}
      {...(preload ? { preload: true, fetchPriority: 'high' as const } : {})}
    />
  )
}
