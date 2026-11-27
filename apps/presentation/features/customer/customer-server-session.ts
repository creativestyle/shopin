import { cookies } from 'next/headers'
import { SESSION_COOKIE_NAME } from '@config/constants'
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

  // No SHOPin session: a guest. A session the BFF renews during this call cannot reach the browser, which is
  // harmless: the next browser request renews it again.
  if (!hasCookie(SESSION_COOKIE_NAME)) {
    return 'signed-out'
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
