import { VARY_DIMENSIONS } from './registry'

const SEP = '__'
// All internally-rewritten vary segments start with this marker so the proxy
// matcher can exclude them, preventing the proxy from re-running on its own
// rewrite targets and causing a redirect loop.
// Uses ~ (tilde) to avoid double-underscore which can clash with Turbopack's
// internal chunk-name separator and cause a build panic.
const VARY_PREFIX = '~'

type CookieStore = { get: (name: string) => { value: string } | undefined }

export function resolveVary(
  getCookie: (name: string) => string | undefined
): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const dim of VARY_DIMENSIONS) {
    const val = getCookie(dim.cookie)
    resolved[dim.name] =
      val && dim.allowed.includes(val) ? val : dim.defaultValue
  }
  return resolved
}

export function encodeVary(resolved: Record<string, string>): string {
  return (
    VARY_PREFIX +
    VARY_DIMENSIONS.map((dim) => resolved[dim.name] ?? dim.defaultValue).join(
      SEP
    )
  )
}

export function decodeVary(segment: string): Record<string, string> {
  const inner = segment.startsWith(VARY_PREFIX)
    ? segment.slice(VARY_PREFIX.length)
    : segment
  const parts = inner.split(SEP)
  const resolved: Record<string, string> = {}
  for (const [i, dim] of VARY_DIMENSIONS.entries()) {
    const val = parts[i]
    resolved[dim.name] =
      val !== undefined && dim.allowed.includes(val) ? val : dim.defaultValue
  }
  return resolved
}

/** Returns true for internal vary-key URL segments (always prefixed with `v__`).
 *  Used by the proxy matcher exclusion and the leaked-URL guard. */
export function isVarySegment(segment: string): boolean {
  if (!segment.startsWith(VARY_PREFIX)) {
    return false
  }
  const inner = segment.slice(VARY_PREFIX.length)
  const parts = inner.split(SEP)
  if (parts.length !== VARY_DIMENSIONS.length) {
    return false
  }
  return VARY_DIMENSIONS.every((dim, i) => {
    const val = parts[i]
    return val !== undefined && dim.allowed.includes(val)
  })
}

export function varyHeaders(
  resolved: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const dim of VARY_DIMENSIONS) {
    headers[dim.header] = resolved[dim.name] ?? dim.defaultValue
  }
  return headers
}

/** Resolves all vary headers from a cookie source (server store or raw document.cookie string).
 *  Used as the client-side / skipServerCookies fallback in the core BFF fetch. */
export function resolveVaryHeadersFromCookies(
  cookieInput: CookieStore | string
): Record<string, string> {
  const getCookie = (name: string): string | undefined => {
    if (typeof cookieInput === 'string') {
      const match = cookieInput.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
      return match?.[1] ? decodeURIComponent(match[1]) : undefined
    }
    return cookieInput.get(name)?.value
  }
  return varyHeaders(resolveVary(getCookie))
}
