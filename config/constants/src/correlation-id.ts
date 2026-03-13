/**
 * Correlation ID constants for request tracing (header, cookie name, cookie options).
 */

/** HTTP header name used to propagate correlation ID across services. */
export const CORRELATION_ID_HEADER = 'x-correlation-id'

/** Cookie name for correlation ID (survives refresh, sent to Next on full page load for server-side BFF). */
export const CORRELATION_ID_COOKIE = 'correlationId'

/** Cookie options for the client-set correlation ID cookie. */
export const CORRELATION_ID_COOKIE_CONFIG = {
  /**
   * Max age in days (cookie sent to Next on full page load for server-side BFF calls).
   */
  MAX_AGE_DAYS: 1,
  /**
   * SameSite attribute. 'Lax' so cookie is sent on top-level same-site navigation.
   */
  SAME_SITE: 'Lax' as const,
  /**
   * Cookie path.
   */
  PATH: '/',
} as const
