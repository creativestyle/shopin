import { isIP } from 'node:net'
import type { IncomingHttpHeaders } from 'node:http'
import { CLIENT_IP_HEADER, INTERNAL_SECRET_HEADER } from '@config/constants'
import { timingSafeEqualSecrets } from '@core/draft-token'

/** Client IP forwarded by the presentation server, or undefined unless the internal secret matches. */
export function resolveTrustedClientIp(
  headers: IncomingHttpHeaders,
  secret: string | undefined
): string | undefined {
  const providedSecret = headers[INTERNAL_SECRET_HEADER]
  const clientIp = headers[CLIENT_IP_HEADER]

  if (typeof providedSecret !== 'string' || typeof clientIp !== 'string') {
    return undefined
  }
  if (!timingSafeEqualSecrets(providedSecret, secret?.trim())) {
    return undefined
  }

  return isIP(clientIp) ? clientIp : undefined
}
