import type { IncomingHttpHeaders } from 'node:http'
import { INTERNAL_SECRET_HEADER } from '@config/constants'
import { timingSafeEqualSecrets } from '@core/draft-token'

/** True when the request carries the presentation server's internal secret. */
export function isTrustedInternalRequest(
  headers: IncomingHttpHeaders,
  secret: string | undefined
): boolean {
  const providedSecret = headers[INTERNAL_SECRET_HEADER]

  if (typeof providedSecret !== 'string') {
    return false
  }

  return timingSafeEqualSecrets(providedSecret.trim(), secret?.trim())
}
