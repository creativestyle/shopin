/**
 * Content/CMS image API config: hostnames allowed for responsive images
 * (e.g. Contentful Images API). Used by next.config images.remotePatterns
 * and by the presentation content image loader.
 */

/** Hostnames that support the content image API (w, q, fm params). Used for next.config and presentation loader. */
export const CONTENT_IMAGE_API_HOSTS = [
  'images.ctfassets.net',
  'd187yychpee5t0.cloudfront.net',
] as const

/** Default quality (0–100) for content image API. */
export const CONTENT_IMAGE_DEFAULT_QUALITY = 80
