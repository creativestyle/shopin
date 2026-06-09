'use client'

import { useMemo } from 'react'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { generateCorrelationId } from '@core/logger-config'
import { bffFetch as baseBffFetch } from './bff-fetch'
import { getBffClientUrl } from './bff-utils-client'
import {
  getVariantSegmentFromPathname,
  variantHeadersFromSegment,
  resolveVariant,
  variantHeaders,
} from '@/lib/variant/variant-key'
import { VARIANT_DIMENSIONS } from '@/lib/variant/registry'

// Pre-compiled cookie regexes, keyed by cookie name. Cookie names are static
// constants from the registry; building once at module load avoids constructing
// a new RegExp on every render of useBffFetchClient.
const DIMENSION_COOKIE_REGEXES = new Map<string, RegExp>(
  VARIANT_DIMENSIONS.map(({ cookie }) => [
    cookie,
    new RegExp(
      `(?:^|;\\s*)${cookie.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]+)`
    ),
  ])
)

const CLIENT_CORRELATION_ID_KEY = 'correlationId'

/**
 * Gets or creates a correlation ID for the current browser tab (sessionStorage).
 *
 * This is the ONLY place where a user-scoped correlation ID enters the system.
 * Server-side BFF calls (ISR renders, layout data fetching) intentionally do NOT
 * forward a correlation ID — those are either cached responses or shared config
 * fetches, not per-user operations. The BFF generates its own ID for those.
 */
function getOrCreateClientCorrelationId(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  let id = sessionStorage.getItem(CLIENT_CORRELATION_ID_KEY)
  if (!id) {
    id = generateCorrelationId()
    sessionStorage.setItem(CLIENT_CORRELATION_ID_KEY, id)
  }
  return id
}

/**
 * Returns the variant headers for all dimensions so the BFF serves the correct variant.
 *
 * Two paths:
 * 1. Alt-variant URL (local dev after proxy redirect): pathname carries a `~` segment →
 *    decode all dimensions from the URL segment directly.
 * 2. Clean URL (default variant): all preference cookies are still present in the browser →
 *    read each dimension's cookie via resolveVariant so the set of cookies stays in sync
 *    with the registry.
 */
function getActiveVariantHeaders(
  pathname: string
): Record<string, string> | undefined {
  const variantSegment = getVariantSegmentFromPathname(pathname)
  if (variantSegment) {
    return variantHeadersFromSegment(variantSegment)
  }
  if (typeof document === 'undefined') {
    return undefined
  }
  // Build a cookie-reader and resolve all variant dimensions at once.
  // resolveVariant reads dim.cookie for each dimension and validates against dim.allowed,
  // so adding a new dimension to the registry is automatically covered here.
  const cookieString = document.cookie
  return variantHeaders(
    resolveVariant(
      (name) => cookieString.match(DIMENSION_COOKIE_REGEXES.get(name)!)?.[1]
    )
  )
}

/**
 * Client-side BFF client hook
 *
 * Provides a fetch wrapper that:
 * - Uses the external BFF URL (NEXT_PUBLIC_BFF_EXTERNAL_URL)
 * - Automatically gets the current locale from next-intl client hook
 * - Sends a stable per-tab correlation ID so BFF logs can be traced per user session
 * - Forwards all active variant headers (X-Data-Source etc.) derived from the URL variant
 *   segment (alt-variant) or the preference cookies (default variant / clean URL)
 */
export function useBffFetchClient() {
  const locale = useLocale()
  const baseUrl = getBffClientUrl()
  const pathname = usePathname()

  const activeVariantHeaders = useMemo(
    () => getActiveVariantHeaders(pathname),
    [pathname]
  )

  return {
    fetch: async (path: string, options?: RequestInit) => {
      const correlationId = getOrCreateClientCorrelationId()
      return baseBffFetch(
        baseUrl,
        path,
        {
          ...options,
          ...(activeVariantHeaders && { variantHeaders: activeVariantHeaders }),
        },
        locale,
        correlationId
      )
    },
  }
}
