import { cookies, headers } from 'next/headers'
import { CORRELATION_ID_COOKIE, CORRELATION_ID_HEADER } from '@config/constants'
import {
  generateCorrelationId,
  isValidCorrelationId,
} from '@core/logger-config'

/** Correlation ID from x-correlation-id header, then correlationId cookie, then generated. User-provided values are validated to avoid log pollution. */
export async function getCorrelationId(): Promise<string> {
  try {
    const headersList = await headers()
    const fromHeader = headersList.get(CORRELATION_ID_HEADER)
    if (fromHeader && isValidCorrelationId(fromHeader)) {
      return fromHeader
    }
    const cookieStore = await cookies()
    const fromCookie = cookieStore.get(CORRELATION_ID_COOKIE)?.value
    if (fromCookie && isValidCorrelationId(fromCookie)) {
      return fromCookie
    }
  } catch {
    // Unavailable at build time
  }
  return generateCorrelationId()
}
