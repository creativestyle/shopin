/**
 * Authentication cookie name constants
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
export const CSRF_TOKEN_COOKIE_NAME = 'csrf_token'

/**
 * CSRF token header name
 */
export const CSRF_TOKEN_HEADER_NAME = 'X-CSRF-Token'

/**
 * Refresh token max age in milliseconds (200 days)
 */
export const REFRESH_TOKEN_MAX_AGE = 200 * 24 * 60 * 60 * 1000

/**
 * CSRF token configuration
 */
export const CSRF_TOKEN_SIZE_BYTES = 32
export const CSRF_TOKEN_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

/**
 * CSRF token encryption and signing configuration
 */
export const CSRF_TOKEN_CONFIG = {
  KEY_SIZE_BYTES: 32,
  SIGNING_ALGORITHM: 'HS256',
  ENCRYPTION_ALGORITHM: 'dir',
  ENCRYPTION_METHOD: 'A256GCM',
} as const

/**
 * Dependency injection token for access token provider
 */
export const ACCESS_TOKEN_TOKEN = 'ACCESS_TOKEN_TOKEN'

/**
 * TTL for email verification tokens (in minutes)
 */
export const EMAIL_TOKEN_TTL_MINUTES = 60

/**
 * TTL for password reset tokens (in minutes)
 */
export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60

/**
 * JWT encryption and signing configuration
 */
export const JWT_CONFIG = {
  KEY_SIZE_BYTES: 32,
  SIGNING_ALGORITHM: 'HS256',
  ENCRYPTION_ALGORITHM: 'dir',
  ENCRYPTION_METHOD: 'A256GCM',
} as const
