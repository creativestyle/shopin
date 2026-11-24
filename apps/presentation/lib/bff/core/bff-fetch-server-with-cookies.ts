import {
  ACCESS_TOKEN_COOKIE_NAME,
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
  CORRELATION_ID_HEADER,
  INTERNAL_SECRET_HEADER,
  REFRESH_TOKEN_COOKIE_NAME,
  WISHLIST_ID_COOKIE_PREFIX_GUEST,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
} from '@config/constants'
import { createBffFetchServer } from './bff-fetch-server'
import { getCorrelationId } from '@/lib/logger/logger-context'
import type { BffFetchClient } from '../types'

export type RequestCookie = { name: string; value: string }

const BFF_COOKIE_NAMES = [ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME]
const BFF_COOKIE_PREFIXES = [
  CART_ID_COOKIE_PREFIX_GUEST,
  CART_ID_COOKIE_PREFIX_LOGGED,
  WISHLIST_ID_COOKIE_PREFIX_GUEST,
  WISHLIST_ID_COOKIE_PREFIX_LOGGED,
]

function isBffCookie({ name }: RequestCookie): boolean {
  return (
    BFF_COOKIE_NAMES.includes(name) ||
    BFF_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))
  )
}

/** Per-user server BFF client: forwards the BFF's own cookies and the correlation id. */
export async function createBffFetchWithCookies(
  requestCookies: RequestCookie[]
): Promise<BffFetchClient> {
  const cookieHeader = requestCookies
    .filter(isBffCookie)
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  const [baseClient, correlationId] = await Promise.all([
    createBffFetchServer(),
    getCorrelationId(),
  ])

  const internalSecret = process.env.BFF_INTERNAL_SECRET?.trim()

  return {
    fetch: (path, options) => {
      const bffHeaders = new Headers(options?.headers)
      bffHeaders.set('Cookie', cookieHeader)
      bffHeaders.set(CORRELATION_ID_HEADER, correlationId)
      // Exempts the call from the BFF rate limit, which would key it on the Next server's IP
      if (internalSecret) {
        bffHeaders.set(INTERNAL_SECRET_HEADER, internalSecret)
      }

      return baseClient.fetch(path, { ...options, headers: bffHeaders })
    },
  }
}
