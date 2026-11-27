'use server'

import { bffFetch as baseBffFetch, type BffFetchOptions } from './bff-fetch'
import { getBffServerUrl } from './bff-utils-server'
import { getLocale } from 'next-intl/server'
import { logger } from '@/lib/logger'
import { getDraftModeHeaderValue } from '@/lib/draft-mode'
import { getRequestVariant } from '@/lib/request-context/variant'
import { variantHeaders, variantCacheTags } from '@/lib/variant/variant-key'
import {
  BffUnreachableError,
  getNetworkErrorCode,
  isBffUnreachableCode,
} from '../utils/bff-unreachable-error'

/**
 * Server-side BFF client
 *
 * Provides a fetch wrapper that:
 * - Uses the internal BFF URL (NEXT_BFF_INTERNAL_URL)
 * - Automatically gets the current locale from next-intl server context
 * - Reads variant from request context (set by initRouteContext in the [variant]/[locale] layout)
 * - Logs network errors only (BFF never sees these: connection refused, timeout, etc.)
 *   and rethrows connection failures as BffUnreachableError.
 *   For 4xx/5xx the BFF already logs; callers can throw or handle as needed.
 *
 * Correlation ID is NOT forwarded here — by design.
 * Server-side BFF calls are either ISR-cached (no per-user request) or shared config
 * fetches (store config, nav, layout). Neither needs user-scoped tracing; the BFF
 * generates its own ID for those. Reading headers()/cookies() to extract a client ID
 * would also opt every caller into dynamic rendering, defeating revalidate = 3600.
 * User-scoped correlation IDs live in useBffFetchClient (client side).
 * Exception: per-user calls on dynamic routes (checkout guard, auth session) use
 * createBffFetchWithCookies, which forwards cookies and the correlation ID.
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
  // Resolve variant context once at construction time. getRequestVariant() reads
  // ALS / React-cache which are both request-scoped and fixed from this point on.
  const requestVariant = getRequestVariant()

  return {
    fetch: async (path: string, options?: RequestInit) => {
      try {
        const extraOpts: Partial<BffFetchOptions> = {}
        if (requestVariant !== undefined) {
          extraOpts.variantHeaders = variantHeaders(requestVariant)
          // Per-category tags next to the shared bff-data tag, on fetches that are ISR-cached.
          const next = (options as { next?: { tags?: string[] } } | undefined)
            ?.next
          if (next?.tags) {
            ;(extraOpts as { next?: object }).next = {
              ...next,
              tags: [...next.tags, ...variantCacheTags(requestVariant)],
            }
          }
        }
        if (opts?.isDraft === true) {
          extraOpts.draftToken = getDraftModeHeaderValue()
        }
        return await baseBffFetch(
          baseUrl,
          path,
          { ...options, ...extraOpts },
          effectiveLocale
        )
      } catch (error) {
        const code = getNetworkErrorCode(error)
        const unreachable = isBffUnreachableCode(code)
        logger.error(
          {
            path,
            bffUrl: baseUrl,
            code,
            error: error instanceof Error ? error.message : String(error),
          },
          unreachable ? 'BFF unreachable' : 'BFF request failed'
        )
        if (unreachable) {
          throw new BffUnreachableError(baseUrl, code, { cause: error })
        }
        throw error
      }
    },
  }
}
