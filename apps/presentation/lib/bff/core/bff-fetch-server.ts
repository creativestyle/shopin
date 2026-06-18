'use server'

import { bffFetch as baseBffFetch, type BffFetchOptions } from './bff-fetch'
import { getBffServerUrl } from './bff-utils-server'
import { getLocale } from 'next-intl/server'
import { logger } from '@/lib/logger'
import { getRequestVariant } from '@/lib/request-context/variant'
import { variantHeaders } from '@/lib/variant/variant-key'

/**
 * Server-side BFF client
 *
 * Provides a fetch wrapper that:
 * - Uses the internal BFF URL (NEXT_BFF_INTERNAL_URL)
 * - Automatically gets the current locale from next-intl server context
 * - Reads variant from request context (set by initRouteContext in the [variant]/[locale] layout)
 * - Logs network errors only (BFF never sees these: connection refused, timeout, etc.).
 *   For 4xx/5xx the BFF already logs; callers can throw or handle as needed.
 *
 * Correlation ID is NOT forwarded here — by design.
 * Server-side BFF calls are either ISR-cached (no per-user request) or shared config
 * fetches (store config, nav, layout). Neither needs user-scoped tracing; the BFF
 * generates its own ID for those. Reading headers()/cookies() to extract a client ID
 * would also opt every caller into dynamic rendering, defeating revalidate = 3600.
 * User-scoped correlation IDs live exclusively in useBffFetchClient (client side).
 *
 * @param opts.locale - Locale override when not using next-intl context (e.g. i18n/request.ts).
 * @param opts.isDraft - Controls draft header:
 *   false (default) → no draft header (ISR-safe)
 *   true → add draft header (preview route only)
 */
export async function createBffFetchServer(opts?: {
  locale?: string
  isDraft?: boolean
}) {
  const [effectiveLocale, baseUrl] = await Promise.all([
    opts?.locale || getLocale(),
    getBffServerUrl(),
  ])
  return {
    fetch: async (path: string, options?: RequestInit) => {
      try {
        const requestVariant = getRequestVariant()
        const resolvedVariantHeaders =
          requestVariant !== undefined
            ? variantHeaders(requestVariant)
            : undefined
        const extraOpts: Partial<BffFetchOptions> = {}
        if (resolvedVariantHeaders != null) {
          extraOpts.variantHeaders = resolvedVariantHeaders
        }
        if (opts?.isDraft === true) {
          extraOpts.isDraft = true
        }
        return await baseBffFetch(
          baseUrl,
          path,
          { ...options, ...extraOpts },
          effectiveLocale
        )
      } catch (error) {
        logger.error(
          {
            path,
            error: error instanceof Error ? error.message : String(error),
          },
          'BFF request failed'
        )
        throw error
      }
    },
  }
}
