import { ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import {
  ThrottlerGuard,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerModuleOptions,
  ThrottlerStorage,
  type ThrottlerRequest,
} from '@nestjs/throttler'
import type { Request } from 'express'
import { isTrustedInternalRequest } from './internal-request'

/** Skip key: @SecureRateLimit() sets SkipThrottle({ default: true }), so only secure routes have this true. */
const THROTTLER_SKIP = 'THROTTLER:SKIP'

/**
 * Applies rate limiting only when BFF_RATE_LIMIT_ENABLED is "true".
 * When BFF_RATE_LIMIT_ENABLED is false/unset, all throttling is disabled (default and secure).
 * Secure endpoints (auth, payment, order, change-password) also depend on this flag.
 * The "secure" throttler runs only on routes that use @SecureRateLimit(). The choice is made per request
 * (`handleRequest`), never by changing the guard's shared throttler list: requests run concurrently.
 * Requests carrying a matching BFF_INTERNAL_SECRET header skip throttling on non-secure routes only.
 */
@Injectable()
export class OptionalThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly config: ConfigService
  ) {
    super(options, storageService, reflector)
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitEnabled =
      this.config.get<string>('BFF_RATE_LIMIT_ENABLED') ?? 'false'
    if (rateLimitEnabled !== 'true') {
      return true
    }
    const isSecureRoute =
      this.reflector.getAllAndOverride(THROTTLER_SKIP + 'default', [
        context.getHandler(),
        context.getClass(),
      ]) === true
    // Internal calls would otherwise share the Next server's IP bucket; secure routes keep their limits
    const request = context.switchToHttp().getRequest<Request>()
    if (
      !isSecureRoute &&
      isTrustedInternalRequest(
        request.headers,
        this.config.get<string>('BFF_INTERNAL_SECRET')
      )
    ) {
      return true
    }
    return super.canActivate(context)
  }

  protected async handleRequest(request: ThrottlerRequest): Promise<boolean> {
    if (
      request.throttler.name === 'secure' &&
      this.reflector.getAllAndOverride(THROTTLER_SKIP + 'default', [
        request.context.getHandler(),
        request.context.getClass(),
      ]) !== true
    ) {
      return true
    }
    return super.handleRequest(request)
  }
}
