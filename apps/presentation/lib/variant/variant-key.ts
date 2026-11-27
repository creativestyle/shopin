import type { Capabilities } from '@core/integration-kit/core'
import { STOREFRONT } from '@/lib/storefront-config'
import { VARIANT_DIMENSIONS } from './registry'

const SEP = '__'
// All internally-rewritten variant segments start with this marker so the proxy
// matcher can exclude them, preventing the proxy from re-running on its own
// rewrite targets and causing a redirect loop.
// Uses ~ (tilde) to avoid double-underscore which can clash with Turbopack's
// internal chunk-name separator and cause a build panic.
const VARIANT_PREFIX = '~'

/** The combination these values make (an unknown value counts as the dimension's default). */
const keyOf = (chosen: Record<string, string | undefined>) =>
  VARIANT_DIMENSIONS.map((dim) => {
    const value = chosen[dim.name]
    return value !== undefined && dim.allowed.includes(value)
      ? value
      : dim.defaultValue
  }).join(SEP)

/** A combination that falls back (a ruled-out choice) becomes the one it names (`to`), as the BFF resolves it. */
function normalise(
  chosen: Record<string, string | undefined>
): Record<string, string> {
  const key = keyOf(chosen)
  const found = STOREFRONT.variants.combinations[key]
  const values = (found && 'to' in found ? found.to : key).split(SEP)
  return Object.fromEntries(
    VARIANT_DIMENSIONS.map((dim, i) => [
      dim.name,
      values[i] ?? dim.defaultValue,
    ])
  )
}

export function resolveVariant(
  getCookie: (name: string) => string | undefined
): Record<string, string> {
  const chosen: Record<string, string | undefined> = {}
  for (const dim of VARIANT_DIMENSIONS) {
    chosen[dim.name] = getCookie(dim.cookie)
  }
  return normalise(chosen)
}

/** Providers, unavailable categories and optional services of a resolved variant. */
export function variantCapabilities(
  resolved: Record<string, string>
): Capabilities {
  const found = STOREFRONT.variants.combinations[keyOf(resolved)]
  if (!found || 'to' in found) {
    throw new Error(`not a resolved variant: ${JSON.stringify(resolved)}`)
  }
  return found
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
  const chosen: Record<string, string | undefined> = {}
  for (const [i, dim] of VARIANT_DIMENSIONS.entries()) {
    chosen[dim.name] = parts[i]
  }
  return normalise(chosen)
}

/** Returns true for any segment that starts with the internal variant prefix `~`.
 *  The `~` marker must never appear in public URLs — valid variant or not.
 *  Used by the leaked-URL guard in the proxy to redirect direct external hits. */
export function hasVariantPrefix(segment: string): boolean {
  return segment.startsWith(VARIANT_PREFIX)
}

/** Returns true for internal variant-key URL segments (always prefixed with `~`).
 *  Used by initRouteContext to validate the [variant] route param, and by
 *  use-locale-switcher to detect a variant prefix in the current pathname. */
export function isVariantSegment(segment: string): boolean {
  if (!segment.startsWith(VARIANT_PREFIX)) {
    return false
  }
  const inner = segment.slice(VARIANT_PREFIX.length)
  // no dimensions (switching off, or one provider per category): the only variant is the bare `~`
  const parts = inner === '' ? [] : inner.split(SEP)
  if (parts.length !== VARIANT_DIMENSIONS.length) {
    return false
  }
  const known = VARIANT_DIMENSIONS.every((dim, i) => {
    const val = parts[i]
    return val !== undefined && dim.allowed.includes(val)
  })
  // a combination the config rules out is not a variant (it would duplicate the one it falls back to)
  return known && encodeVariant(decodeVariant(segment)) === segment
}

/** One header per variant dimension (only with an integration that declares variants; without one there are none). */
export function variantHeaders(
  resolved: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const dim of VARIANT_DIMENSIONS) {
    headers[dim.header] = resolved[dim.name] ?? dim.defaultValue
  }
  return headers
}

/** Cache tags `variant:<category>:<provider>`, so revalidateTag('variant:cms:<provider>') refreshes
 *  that provider's data in every variant using it. */
export function variantCacheTags(resolved: Record<string, string>): string[] {
  return VARIANT_DIMENSIONS.map(
    (dim) => `variant:${dim.name}:${resolved[dim.name] ?? dim.defaultValue}`
  )
}

/** Precomputed default variant segment — the internal URL prefix for the default providers.
 *  All clean public URLs (/en/foo) are rewritten to this prefix by the proxy. */
export const DEFAULT_VARIANT_SEGMENT = encodeVariant(
  resolveVariant(() => undefined)
)

/** Returns true only for the default variant segment (all dimensions at their default value).
 *  Used by {@link getVariantSegmentFromPathname} to treat the default segment as "no active
 *  variant" (return null), so URL-derived callers fall back to the default providers. */
export function isDefaultVariantSegment(segment: string): boolean {
  return segment === DEFAULT_VARIANT_SEGMENT
}

/** Derives variant headers from a URL variant segment.
 *  Used by the client BFF to derive the X-<Category>-Provider headers from the active pathname
 *  instead of reading the provider cookies. */
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
