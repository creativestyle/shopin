'use client'

import { useLocale } from 'next-intl'
import { generateCorrelationId } from '@core/logger-config'
import {
  CORRELATION_ID_COOKIE,
  CORRELATION_ID_COOKIE_CONFIG,
} from '@config/constants'
import { bffFetch as baseBffFetch } from './bff-fetch'
import { getBffClientUrl } from './bff-utils-client'

const CLIENT_CORRELATION_ID_KEY = 'correlationId'

/**
 * Gets or creates a correlation ID for the current tab. Stored in sessionStorage
 * and in a cookie so it survives refresh and is sent to Next on full page load
 * (so server-side BFF calls use the same ID).
 */
function getOrCreateClientCorrelationId(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  let id = sessionStorage.getItem(CLIENT_CORRELATION_ID_KEY)
  if (!id) {
    id = generateCorrelationId()
    sessionStorage.setItem(CLIENT_CORRELATION_ID_KEY, id)
    const { MAX_AGE_DAYS, SAME_SITE, PATH } = CORRELATION_ID_COOKIE_CONFIG
    const maxAgeSec = 60 * 60 * 24 * MAX_AGE_DAYS
    const secure =
      typeof location !== 'undefined' && location.protocol === 'https:'
    document.cookie = `${CORRELATION_ID_COOKIE}=${id}; path=${PATH}; max-age=${maxAgeSec}; SameSite=${SAME_SITE}${secure ? '; Secure' : ''}`
  }
  return id
}

/**
 * Client-side BFF client hook
 *
 * Provides a fetch wrapper that:
 * - Uses the external BFF URL (NEXT_PUBLIC_BFF_EXTERNAL_URL)
 * - Automatically gets the current locale from next-intl client hook
 * - Sends a stable correlation ID (sessionStorage) so BFF logs stay consistent across refresh
 * - Handles client-side cookie access
 */
export function useBffFetchClient() {
  const locale = useLocale()
  const baseUrl = getBffClientUrl()

  return {
    /**
     * Fetch wrapper that automatically includes the current locale and correlation ID
     * @param path - API path (e.g., 'navigation/getNavigation')
     * @param options - Fetch options (headers, body, etc.)
     */
    fetch: async (path: string, options?: RequestInit) => {
      const correlationId = getOrCreateClientCorrelationId()
      return baseBffFetch(baseUrl, path, options, locale, correlationId)
    },
  }
}
