import type { BffFetchClient } from '../types'
import { RateLimitError } from './rate-limit-error'

export interface CsrfTokenResponse {
  token: string
}

/**
 * Get CSRF token from the BFF
 * @param bffFetch - BFF fetch client
 * @returns The CSRF token
 */
export async function getCsrfToken(bffFetch: BffFetchClient): Promise<string> {
  const res = await bffFetch.fetch('/csrf/token', {
    method: 'GET',
  })

  if (!res.ok) {
    if (res.status === 429) {
      throw new RateLimitError()
    }
    throw new Error('Failed to fetch CSRF token')
  }

  const data = (await res.json()) as CsrfTokenResponse
  return data.token
}
