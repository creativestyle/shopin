/**
 * Draft mode: session-cookie + URL-token-based CMS preview.
 *
 * Entry flow: /api/draft?secret=X&slug=Y&locale=Z validates the secret, generates a
 * short-lived signed token, and redirects to /<locale>/preview/<slug>. The proxy then
 * establishes a draft session cookie so in-app navigation continues in draft mode.
 *
 * Token delivery:
 * - HTTPS (production): HttpOnly SameSite=None;Secure cookie set by /api/draft. Works in
 *   Contentful's cross-site iframe. The proxy reads the cookie and injects it as ?__pt=
 *   in the internal rewrite URL. The token never appears in the public URL.
 * - HTTP (local dev): URL param ?__pt= appended by /api/draft (SameSite=None;Secure is
 *   unavailable without TLS). The preview page validates it. The proxy also establishes a
 *   SameSite=Lax HttpOnly cookie on the first preview load so subsequent in-app navigation
 *   stays in draft mode. The __pt param is stripped from the address bar by the preview
 *   layout's client-side StripPreviewToken component after hydration; the session cookie
 *   keeps the session alive for reloads.
 *
 * In-app draft navigation: the proxy checks for the preview_token cookie on every
 * request and rewrites clean /en/… paths to the preview subtree when a valid session is
 * active. Draft state therefore persists across Next.js router navigations, not just
 * explicit /preview/ URL visits.
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
 * The proxy injects it into the internal rewrite URL (HTTPS: from cookie; HTTP: already
 * present in the URL or injected from the session cookie). The preview page validates
 * the token. The StripPreviewToken client component removes it from the address bar
 * after hydration; the session cookie keeps the session alive for reloads.
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

/**
 * Returns true iff the preview token is validly signed, unexpired, and within the
 * issued lifetime (DRAFT_COOKIE_MAX_AGE_SEC + slack). This is the proxy's verification
 * gate before a preview session cookie is minted; the preview route uses it too as
 * defense-in-depth.
 */
export function isPreviewTokenValid(token: string | null | undefined): boolean {
  if (!token) {
    return false
  }
  const secret = getSecret()
  if (!secret) {
    return false
  }
  return verifyDraftToken(token, secret, DRAFT_COOKIE_MAX_AGE_SEC)
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
