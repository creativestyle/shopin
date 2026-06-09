/**
 * Draft mode: URL-token-based CMS preview.
 *
 * Flow: /api/draft?secret=X&slug=Y&locale=Z validates the secret, generates a short-lived
 * signed token, and redirects to /<locale>/preview/<slug>?__pt=<token>. The proxy preserves
 * __pt when rewriting to the internal route. The preview page validates the token, renders
 * draft content, then strips __pt from the address bar via router.replace(). Regular live
 * routes are never involved and remain ISR-cacheable.
 *
 * Why URL param: Contentful opens preview in a cross-site iframe. SameSite=Lax cookies are
 * not forwarded in cross-site iframes so cookie delivery is unreliable. URL params have no
 * same-site restriction and work in all embedding contexts including HTTP localhost.
 *
 * Security: the token is signed + short-lived (DRAFT_COOKIE_MAX_AGE_SEC). It is briefly
 * visible in the address bar during navigation and then stripped by the preview page.
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

/**
 * HttpOnly cookie carrying the signed preview token on HTTPS (production).
 * On HTTPS, /api/draft sets this with SameSite=None;Secure so it is forwarded
 * even inside Contentful's cross-site iframe. Not usable on plain HTTP.
 */
export const PREVIEW_TOKEN_COOKIE = 'preview_token'

/**
 * URL search param carrying the signed preview token on HTTP (local dev).
 * On HTTP, SameSite=None;Secure is unavailable so the token travels via URL param.
 * The proxy injects it into the internal rewrite URL; the preview page strips it
 * from the address bar via router.replace() after rendering.
 */
export const PREVIEW_TOKEN_INTERNAL_PARAM = '__pt'

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
