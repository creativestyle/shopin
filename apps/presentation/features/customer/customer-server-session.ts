import { cookies } from 'next/headers'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '@config/constants'
import { createBffFetchWithCookies } from '@/lib/bff/core/bff-fetch-server-with-cookies'
import { logger } from '@/lib/logger'
import { CustomerService } from './lib/customer-bff-service'

/** `unknown` leaves the decision to the client guard. */
export type ServerSession = 'signed-in' | 'signed-out' | 'unknown'

/** Signed-in state for Server Components, read from the request cookies via the BFF. */
export async function getServerSession(): Promise<ServerSession> {
  const requestCookies = (await cookies()).getAll()
  const hasCookie = (name: string) =>
    requestCookies.some((cookie) => cookie.name === name)

  if (!hasCookie(ACCESS_TOKEN_COOKIE_NAME)) {
    // Refresh-only session: the BFF would refresh via a Set-Cookie the browser never gets
    return hasCookie(REFRESH_TOKEN_COOKIE_NAME) ? 'unknown' : 'signed-out'
  }

  try {
    const bffFetch = await createBffFetchWithCookies(requestCookies)
    const customer = await new CustomerService(bffFetch).getCurrentCustomer()
    return customer ? 'signed-in' : 'signed-out'
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Server session: customer fetch failed'
    )
    return 'unknown'
  }
}
