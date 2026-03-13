import { ExecutionContext, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import {
  ThrottlerGuard,
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler'

/** Skip key: @SecureRateLimit() sets SkipThrottle({ default: true }), so only secure routes have this true. */
const THROTTLER_SKIP = 'THROTTLER:SKIP'

/**
 * Applies rate limiting only when BFF_RATE_LIMIT_ENABLED is "true".
 * When BFF_RATE_LIMIT_ENABLED is false/unset, all throttling is disabled (default and secure).
 * Secure endpoints (auth, payment, order, change-password) also depend on this flag.
 * Ensures the "secure" throttler runs only on routes that use @SecureRateLimit()
 * when rate limiting is enabled.
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
    const handler = context.getHandler()
    const classRef = context.getClass()
    const reflector = (
      this as unknown as {
        reflector: {
          getAllAndOverride: (key: string, targets: unknown[]) => unknown
        }
      }
    ).reflector
    const skipDefault = reflector.getAllAndOverride(
      THROTTLER_SKIP + 'default',
      [handler, classRef]
    )
    const isSecureRoute = skipDefault === true
    const throttlers = (
      this as unknown as { throttlers: Array<{ name?: string }> }
    ).throttlers
    const throttlersToApply = throttlers.filter(
      (t) => t.name !== 'secure' || isSecureRoute
    )
    ;(this as unknown as { throttlers: Array<{ name?: string }> }).throttlers =
      throttlersToApply
    try {
      return await super.canActivate(context)
    } finally {
      ;(
        this as unknown as { throttlers: Array<{ name?: string }> }
      ).throttlers = throttlers
    }
  }
}
