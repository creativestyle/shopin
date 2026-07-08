'use client'

import {
  getVariantSegmentFromPathname,
  encodeVariant,
  resolveVariant,
  isDefaultVariantSegment,
} from './variant-key'
import { VARIANT_DIMENSIONS } from './registry'

/**
 * Pre-compiled cookie regexes keyed by cookie name.
 *
 * Built once at module load; avoids constructing a new RegExp on every call.
 * Exported so that bff-fetch-client can share the same compiled regexes.
 */
export const DIMENSION_COOKIE_REGEXES = new Map<string, RegExp>(
  VARIANT_DIMENSIONS.map(({ cookie }) => [
    cookie,
    new RegExp(
      `(?:^|;\\s*)${cookie.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`
    ),
  ])
)

/**
 * Returns the active non-default variant segment from the current pathname,
 * falling back to reading preference cookies when the URL carries no variant
 * prefix (clean URL / default-variant rewrite). Returns null when the active
 * variant equals the default (all dimensions at their default values).
 *
 * Two paths:
 * 1. Alt-variant URL (pathname carries a `~` segment) → return it directly.
 * 2. Clean URL → read each dimension's cookie; return null when all resolve
 *    to their defaults.
 *
 * Used by:
 * - useBffFetchClient — to derive variant headers for client BFF calls.
 * - useLocaleSwitcher — to pass the active variant to resolveLocalizedPath
 *   so slug resolution hits the correct catalog even on clean alt-cookie URLs.
 */
export function getActiveVariantSegment(pathname: string): string | null {
  const fromPath = getVariantSegmentFromPathname(pathname)
  if (fromPath) {
    return fromPath
  }
  if (typeof document === 'undefined') {
    return null
  }
  const cookieString = document.cookie
  const resolved = resolveVariant(
    // /(?!)/ is a no-match regex used as a safe fallback: DIMENSION_COOKIE_REGEXES
    // is built from the same VARIANT_DIMENSIONS so a missing key is impossible in
    // normal operation, but the fallback avoids a TypeError if registries ever diverge.
    (name) =>
      cookieString.match(DIMENSION_COOKIE_REGEXES.get(name) ?? /(?!)/)?.[1]
  )
  const segment = encodeVariant(resolved)
  return isDefaultVariantSegment(segment) ? null : segment
}
