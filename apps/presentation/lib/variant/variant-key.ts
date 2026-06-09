import { VARIANT_DIMENSIONS } from './registry'

const SEP = '__'
// All internally-rewritten variant segments start with this marker so the proxy
// matcher can exclude them, preventing the proxy from re-running on its own
// rewrite targets and causing a redirect loop.
// Uses ~ (tilde) to avoid double-underscore which can clash with Turbopack's
// internal chunk-name separator and cause a build panic.
const VARIANT_PREFIX = '~'

export function resolveVariant(
  getCookie: (name: string) => string | undefined
): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const dim of VARIANT_DIMENSIONS) {
    const val = getCookie(dim.cookie)
    resolved[dim.name] =
      val && dim.allowed.includes(val) ? val : dim.defaultValue
  }
  return resolved
}

export function encodeVariant(resolved: Record<string, string>): string {
  return (
    VARIANT_PREFIX +
    VARIANT_DIMENSIONS.map(
      (dim) => resolved[dim.name] ?? dim.defaultValue
    ).join(SEP)
  )
}

export function decodeVariant(segment: string): Record<string, string> {
  const inner = segment.startsWith(VARIANT_PREFIX)
    ? segment.slice(VARIANT_PREFIX.length)
    : segment
  const parts = inner.split(SEP)
  const resolved: Record<string, string> = {}
  for (const [i, dim] of VARIANT_DIMENSIONS.entries()) {
    const val = parts[i]
    resolved[dim.name] =
      val !== undefined && dim.allowed.includes(val) ? val : dim.defaultValue
  }
  return resolved
}

/** Returns true for internal variant-key URL segments (always prefixed with `~`).
 *  Used by the leaked-URL guard in the proxy to redirect direct external hits. */
export function isVariantSegment(segment: string): boolean {
  if (!segment.startsWith(VARIANT_PREFIX)) {
    return false
  }
  const inner = segment.slice(VARIANT_PREFIX.length)
  const parts = inner.split(SEP)
  if (parts.length !== VARIANT_DIMENSIONS.length) {
    return false
  }
  return VARIANT_DIMENSIONS.every((dim, i) => {
    const val = parts[i]
    return val !== undefined && dim.allowed.includes(val)
  })
}

export function variantHeaders(
  resolved: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const dim of VARIANT_DIMENSIONS) {
    headers[dim.header] = resolved[dim.name] ?? dim.defaultValue
  }
  return headers
}

/** Precomputed default variant segment — the internal URL prefix for the default data source.
 *  All clean public URLs (/en/foo) are rewritten to this prefix by the proxy. */
export const DEFAULT_VARIANT_SEGMENT = encodeVariant(
  resolveVariant(() => undefined)
)

/** Returns true only for the default variant segment (all dimensions at their default value).
 *  The proxy uses this to distinguish the default segment (308-redirect to the clean canonical
 *  URL) from non-default segments (valid public alt-variant URLs, pass through). */
export function isDefaultVariantSegment(segment: string): boolean {
  return segment === DEFAULT_VARIANT_SEGMENT
}

/** Derives variant headers from a URL variant segment.
 *  Used by the client BFF to derive X-Data-Source from the active pathname
 *  instead of reading the data-source cookie. */
export function variantHeadersFromSegment(
  segment: string
): Record<string, string> {
  return variantHeaders(decodeVariant(segment))
}

/** Returns the non-default variant segment from a pathname's first segment, or null
 *  if the pathname uses the default variant (clean URL) or has no variant prefix.
 *  Used by useBffFetchClient and use-locale-switcher to derive the active variant from the URL. */
export function getVariantSegmentFromPathname(pathname: string): string | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? ''
  if (
    !isVariantSegment(firstSegment) ||
    isDefaultVariantSegment(firstSegment)
  ) {
    return null
  }
  return firstSegment
}
