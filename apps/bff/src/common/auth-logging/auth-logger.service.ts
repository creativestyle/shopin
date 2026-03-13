import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import type { Request } from 'express'
import type { AuthLogContext } from './auth-logging.types'

/**
 * Build request-derived fields for auth logs (ip, userAgent, correlationId).
 * Safe to call with undefined request.
 */
export function authLogContextFromRequest(
  req: Request | undefined
): Pick<AuthLogContext, 'ip' | 'userAgent' | 'correlationId'> {
  if (!req) {
    return {}
  }
  const forwarded = req.headers['x-forwarded-for']
  const ip =
    req.ip ||
    (typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : undefined) ||
    (req as Request & { connection?: { remoteAddress?: string } }).connection
      ?.remoteAddress
  return {
    ...(ip && { ip }),
    ...(req.headers['user-agent'] && { userAgent: req.headers['user-agent'] }),
    ...(req.id !== undefined && { correlationId: String(req.id) }),
  }
}

/**
 * Structured auth audit logging for security and compliance.
 *
 * Logs authentication-related events (login, logout, register, password change,
 * token refresh, etc.) with a consistent schema so they can be queried and
 * alerted on (e.g. in GCP Logging: jsonPayload.auth.action, jsonPayload.auth.outcome).
 *
 * Do not log passwords, tokens, or other secrets. Redaction is handled by the
 * base Pino config; this service only adds structured auth fields.
 */
@Injectable()
export class AuthLoggerService {
  constructor(private readonly logger: PinoLogger) {}

  /**
   * Log an auth event. Use from auth controllers and interceptors.
   * Failures are logged at warn level; success at info.
   */
  log(ctx: AuthLogContext): void {
    const authPayload = {
      auth: {
        action: ctx.action,
        outcome: ctx.outcome,
        ...(ctx.userId !== undefined && { userId: ctx.userId }),
        ...(ctx.outcome === 'failure' && { reason: ctx.reason }),
        ...(ctx.ip !== undefined && { ip: ctx.ip }),
        ...(ctx.userAgent !== undefined && { userAgent: ctx.userAgent }),
        ...(ctx.correlationId !== undefined && {
          correlationId: ctx.correlationId,
        }),
        ...(ctx.metadata !== undefined &&
          ctx.metadata !== null && { metadata: ctx.metadata }),
      },
    }

    if (ctx.outcome === 'failure') {
      this.logger.warn(authPayload, `Auth ${ctx.action} failed`)
    } else {
      this.logger.info(authPayload, `Auth ${ctx.action} success`)
    }
  }
}
