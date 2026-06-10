import { cache } from 'react'

const getHolder = cache((): { value: Record<string, string> | undefined } => ({
  value: undefined,
}))

export function setRequestVariant(resolved: Record<string, string>): void {
  getHolder().value = resolved
}

/**
 * Returns the variant dimensions written by {@link initRouteContext} for the
 * current `[variant]/[locale]` server segment (decoded from the URL route
 * param — never from cookies or headers).
 *
 * Every in-tree page/layout calls `initRouteContext`, so this is always set
 * for route-tree renders. `undefined` only occurs for callers outside the
 * route tree (e.g. `i18n/request.ts` locale detection). In that case the
 * consumer omits the variant header and the BFF falls back to its default
 * data source — there is no server-side cookie fallback (cookie-based
 * variant resolution is client-only, in `bff-fetch-client.ts`).
 */
export function getRequestVariant(): Record<string, string> | undefined {
  return getHolder().value
}
