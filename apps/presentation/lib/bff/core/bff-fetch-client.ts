'use client'

import { useLocale } from 'next-intl'
import { generateCorrelationId } from '@core/logger-config'
import { bffFetch as baseBffFetch } from './bff-fetch'
import { getBffClientUrl } from './bff-utils-client'

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
 * Client-side BFF client hook
 *
 * Provides a fetch wrapper that:
 * - Uses the external BFF URL (NEXT_PUBLIC_BFF_EXTERNAL_URL)
 * - Automatically gets the current locale from next-intl client hook
 * - Sends a stable per-tab correlation ID so BFF logs can be traced per user session
 */
export function useBffFetchClient() {
  const locale = useLocale()
  const baseUrl = getBffClientUrl()

  return {
    fetch: async (path: string, options?: RequestInit) => {
      const correlationId = getOrCreateClientCorrelationId()
      return baseBffFetch(baseUrl, path, options, locale, correlationId)
    },
  }
}
