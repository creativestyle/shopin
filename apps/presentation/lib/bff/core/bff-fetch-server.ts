'use server'

import { bffFetch as baseBffFetch } from './bff-fetch'
import { getBffServerUrl } from './bff-utils-server'
import { getLocale } from 'next-intl/server'
import { logger } from '@/lib/logger'
import { getRequestDataSource } from '@/lib/request-context/data-source'

/**
 * Server-side BFF client
 *
 * Provides a fetch wrapper that:
 * - Uses the internal BFF URL (NEXT_BFF_INTERNAL_URL)
 * - Automatically gets the current locale from next-intl server context
 * - Handles server-side cookie access
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
 * @param opts.isDraft - Controls cookies and draft header:
 *   false (default) → skip cookies, no draft header (ISR-safe)
 *   true → skip cookies, add draft header (preview route only)
 */
export async function createBffFetchServer(opts?: {
  locale?: string
  isDraft?: boolean
}) {
  const [effectiveLocale, baseUrl] = await Promise.all([
    opts?.locale || getLocale(),
    getBffServerUrl(),
  ])
  const dataSource = getRequestDataSource()

  return {
    fetch: async (path: string, options?: RequestInit) => {
      try {
        const extraOpts =
          opts?.isDraft === true
            ? {
                skipServerCookies: true as const,
                isDraft: true as const,
                dataSource,
              }
            : { skipServerCookies: true as const, dataSource }
        return await baseBffFetch(
          baseUrl,
          path,
          extraOpts ? { ...options, ...extraOpts } : options,
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
