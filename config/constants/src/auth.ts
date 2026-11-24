import type { DataSource } from './data-source'

/**
 * Authentication cookie name constants
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'access_token'
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
export const CSRF_TOKEN_COOKIE_NAME = 'csrf_token'

// Mock sessions live in BFF memory, so their tokens must not overwrite commercetools tokens.
const TOKEN_COOKIE_SUFFIX_BY_DATA_SOURCE: Partial<Record<DataSource, string>> =
  {
    'mock-set': 'mock',
  }

/**
 * Token cookie names for a data source: `access_token` / `refresh_token`, with
 * a suffix for data sources whose auth keeps its own sessions (e.g.
 * `access_token-mock`). Switching data source then keeps each session intact.
 */
export function getTokenCookieNames(dataSource?: DataSource) {
  const suffix = dataSource && TOKEN_COOKIE_SUFFIX_BY_DATA_SOURCE[dataSource]
  return {
    accessToken: suffix
      ? `${ACCESS_TOKEN_COOKIE_NAME}-${suffix}`
      : ACCESS_TOKEN_COOKIE_NAME,
    refreshToken: suffix
      ? `${REFRESH_TOKEN_COOKIE_NAME}-${suffix}`
      : REFRESH_TOKEN_COOKIE_NAME,
  }
}

/** Every access token cookie name, whatever the data source. */
export const ACCESS_TOKEN_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE_NAME,
  ...Object.values(TOKEN_COOKIE_SUFFIX_BY_DATA_SOURCE).map(
    (suffix) => `${ACCESS_TOKEN_COOKIE_NAME}-${suffix}`
  ),
]

/** Every refresh token cookie name, whatever the data source. */
export const REFRESH_TOKEN_COOKIE_NAMES = [
  REFRESH_TOKEN_COOKIE_NAME,
  ...Object.values(TOKEN_COOKIE_SUFFIX_BY_DATA_SOURCE).map(
    (suffix) => `${REFRESH_TOKEN_COOKIE_NAME}-${suffix}`
  ),
]

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
 * Password length limits, shared by registration, reset and change password
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

/**
 * JWT encryption and signing configuration
 */
export const JWT_CONFIG = {
  KEY_SIZE_BYTES: 32,
  SIGNING_ALGORITHM: 'HS256',
  ENCRYPTION_ALGORITHM: 'dir',
  ENCRYPTION_METHOD: 'A256GCM',
} as const
