'use server'

import { createBffFetchServer } from '../core/bff-fetch-server'
import { I18nService } from './i18n-service'

/**
 * Get BFF API client services for server-side usage in Next.js
 * Returns instances of shared BFF service clients.
 * @param locale - Optional locale to use. If not provided, will fetch from next-intl context.
 *                 Pass this when calling from i18n/request.ts to avoid infinite loops.
 */
export async function getServerBffClient(locale?: string) {
  const bffFetch = await createBffFetchServer(locale)

  return {
    i18nService: new I18nService(bffFetch),
  }
}
