/**
 * Draft mode: URL-token-based CMS preview.
 *
 * Flow: /api/draft?secret=X&slug=Y&locale=Z validates the secret, generates a short-lived
 * signed token, and redirects to /<locale>/preview/<slug>?token=<token>. The preview route
 * validates the token before fetching draft content. Regular live routes are never involved
 * in draft detection and remain ISR-cacheable.
 *
 * Security note: the token is in the URL (visible in browser history, logs, referrer headers).
 * It is signed + short-lived (DRAFT_COOKIE_MAX_AGE_SEC). Forwarding the URL grants preview
 * access until expiry — same risk as the previous cookie-sharing approach.
 *
 * Header x-next-draft-mode: a separate short-lived signed token (DRAFT_HEADER_TOKEN_MAX_AGE_SEC)
 * is generated per BFF request so the raw secret never travels on the wire.
 */

import {
  createDraftToken,
  timingSafeEqualSecrets,
  verifyDraftToken,
} from '@core/draft-token'
import {
  DRAFT_COOKIE_MAX_AGE_SEC,
  DRAFT_HEADER_TOKEN_MAX_AGE_SEC,
  DRAFT_MODE_HEADER,
} from '@config/constants'

export { DRAFT_COOKIE_MAX_AGE_SEC, DRAFT_MODE_HEADER }

/** Cookie name for the editor's preview session. HttpOnly, session-scoped (no maxAge). */
export const PREVIEW_TOKEN_COOKIE = 'preview_token'

function getSecret(): string {
  return process.env.NEXT_DRAFT_MODE_SECRET ?? ''
}

/** Returns true iff the provided secret equals NEXT_DRAFT_MODE_SECRET (timing-safe). Use for /api/draft. */
export function isDraftSecretValid(secret: string | null | undefined): boolean {
  return timingSafeEqualSecrets(secret, getSecret())
}

/** Generates a URL-safe preview token. Call from /api/draft after validating request secret. */
export function createPreviewToken(): string {
  return createDraftToken(getSecret(), DRAFT_COOKIE_MAX_AGE_SEC)
}

/** Returns true iff the provided URL preview token is valid and not expired. Use in the preview route. */
export function isPreviewTokenValid(token: string | null | undefined): boolean {
  if (!token) {
    return false
  }
  const secret = getSecret()
  if (!secret) {
    return false
  }
  return verifyDraftToken(token, secret)
}

/** Short-lived signed token for x-next-draft-mode header. Secret never sent; BFF verifies signature. */
export function getDraftModeHeaderValue(): string {
  return createDraftToken(getSecret(), DRAFT_HEADER_TOKEN_MAX_AGE_SEC)
}

/**
 * Validates that locale and normalizedSlug are safe for redirect path construction.
 * Rejects path traversal (e.g. "..", "%2e%2e") and protocol-relative patterns (path starting with "//").
 */
export function isSafeDraftRedirectPath(
  locale: string,
  normalizedSlug: string
): boolean {
  const decodedLocale = safeDecodeUriComponent(locale)
  if (
    !locale ||
    !decodedLocale ||
    decodedLocale.includes('..') ||
    locale.includes('..')
  ) {
    return false
  }
  const decodedSlug = safeDecodeUriComponent(normalizedSlug)
  if (decodedSlug === null || decodedSlug.includes('..')) {
    return false
  }
  const path = `/${locale}/${normalizedSlug}`
  if (path.startsWith('//')) {
    return false
  }
  const segments = [...decodedLocale.split('/'), ...decodedSlug.split('/')]
  if (segments.some((s) => s === '..')) {
    return false
  }
  return true
}

function safeDecodeUriComponent(s: string): string | null {
  try {
    return decodeURIComponent(s)
  } catch {
    return null
  }
}
