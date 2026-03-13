import type { ConfigService } from '@nestjs/config'

function isSet(value: string | undefined): value is string {
  return value !== undefined && value !== ''
}

/**
 * Throttler options for ThrottlerModule.forRootAsync.
 * - default: BFF_RATE_LIMIT_TTL / BFF_RATE_LIMIT_LIMIT
 * - secure: BFF_RATE_LIMIT_SECURE_* (applied only on routes with @SecureRateLimit())
 * Default is false when BFF_RATE_LIMIT_ENABLED is unset; only the string "true" enables rate limiting.
 */
export function createThrottlerOptions(config: ConfigService) {
  const enabled = config.get<string>('BFF_RATE_LIMIT_ENABLED')
  const throttlers: Array<{ name?: string; ttl: number; limit: number }> = []

  const ttlRaw = config.get<string>('BFF_RATE_LIMIT_TTL')
  const limitRaw = config.get<string>('BFF_RATE_LIMIT_LIMIT')
  if (enabled && isSet(ttlRaw) && isSet(limitRaw)) {
    throttlers.push({
      name: 'default',
      ttl: Number(ttlRaw),
      limit: Number(limitRaw),
    })
  }

  const secureTtlRaw = config.get<string>('BFF_RATE_LIMIT_SECURE_TTL')
  const secureLimitRaw = config.get<string>('BFF_RATE_LIMIT_SECURE_LIMIT')
  if (enabled && isSet(secureTtlRaw) && isSet(secureLimitRaw)) {
    throttlers.push({
      name: 'secure',
      ttl: Number(secureTtlRaw),
      limit: Number(secureLimitRaw),
    })
  }

  return { throttlers }
}
