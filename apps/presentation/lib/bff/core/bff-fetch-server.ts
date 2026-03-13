'use server'

import { bffFetch as baseBffFetch } from './bff-fetch'
import { getBffServerUrl } from './bff-utils-server'
import { getLocale } from 'next-intl/server'
import { getCorrelationId } from '@/lib/logger/logger-context'
import { logger } from '@/lib/logger'

/**
 * Server-side BFF client
 *
 * Provides a fetch wrapper that:
 * - Uses the internal BFF URL (NEXT_BFF_INTERNAL_URL)
 * - Automatically gets the current locale from next-intl server context
 * - Forwards correlation ID from request headers so BFF logs use the same ID
 * - Handles server-side cookie access
 * - Logs network errors only (BFF never sees these: connection refused, timeout, etc.).
 *   For 4xx/5xx the BFF already logs; callers can throw or handle as needed.
 * @param locale - Locale override when not using next-intl context (e.g. i18n/request.ts).
 */
export async function createBffFetchServer(locale?: string) {
  const [effectiveLocale, baseUrl, correlationId] = await Promise.all([
    locale || getLocale(),
    getBffServerUrl(),
    getCorrelationId(),
  ])

  return {
    /**
     * Fetch wrapper that automatically includes the current locale and correlation ID
     * @param path - API path (e.g., 'navigation/getNavigation')
     * @param options - Fetch options (headers, body, etc.)
     */
    fetch: async (path: string, options?: RequestInit) => {
      try {
        return await baseBffFetch(
          baseUrl,
          path,
          options,
          effectiveLocale,
          correlationId
        )
      } catch (error) {
        logger.error(
          {
            path,
            correlationId,
            error: error instanceof Error ? error.message : String(error),
          },
          'BFF request failed'
        )
        throw error
      }
    },
  }
}
