/**
 * Next.js Draft Mode: shared constants for header (Next → BFF) and signed cookie.
 */
export const DRAFT_MODE_HEADER = 'x-next-draft-mode'

/** Next.js bypass cookie name (__prerender_bypass); only valid when signed by /api/draft. */
export const DRAFT_COOKIE_NAME = '__prerender_bypass'

export const DRAFT_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 // 24h

/** Header token TTL: short-lived so intercepted value can't be replayed long. */
export const DRAFT_HEADER_TOKEN_MAX_AGE_SEC = 60
