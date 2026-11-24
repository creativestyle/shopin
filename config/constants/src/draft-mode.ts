/**
 * Next.js Draft Mode: shared constants for header (Next → BFF) and signed cookie.
 */
export const DRAFT_MODE_HEADER = 'x-next-draft-mode'

/** Next.js bypass cookie name (__prerender_bypass); only valid when signed by /api/draft. */
export const DRAFT_COOKIE_NAME = '__prerender_bypass'

export const DRAFT_COOKIE_MAX_AGE_SEC = 60 * 60 // 1h

/** Header token TTL: short-lived so intercepted value can't be replayed long. */
export const DRAFT_HEADER_TOKEN_MAX_AGE_SEC = 60

/** HttpOnly cookie carrying the signed preview token for the draft session. */
export const PREVIEW_TOKEN_COOKIE = 'preview_token'

/** Search param carrying the preview token (HTTP entry URL and the proxy's internal rewrite). */
export const PREVIEW_TOKEN_INTERNAL_PARAM = '__pt'

/** Non-HttpOnly UI hint set by the proxy while a draft session is active; never a credential. */
export const PREVIEW_ACTIVE_COOKIE = 'preview_active'
