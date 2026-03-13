import { applyDecorators } from '@nestjs/common'
import { SkipThrottle, Throttle } from '@nestjs/throttler'

/**
 * Use on auth, payment, order, change-password routes.
 * Skips default throttler and applies the "secure" limit (BFF_RATE_LIMIT_SECURE_*) from config.
 */
export const SecureRateLimit = () =>
  applyDecorators(SkipThrottle({ default: true }), Throttle({ secure: {} }))
