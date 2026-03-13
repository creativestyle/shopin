/**
 * Draft mode: cookie + header for CMS preview.
 *
 * We set our own signed __prerender_bypass cookie (not only draftMode().enable()) because:
 * 1) Redirect responses can drop the cookie Next sets in enable(), so we set it on the response.
 * 2) We sign with NEXT_DRAFT_MODE_SECRET so the BFF can trust the same secret.
 * We only treat draft as on when this signed cookie is present and valid.
 *
 * Header x-next-draft-mode: we send a short-lived signed token (exp.signature), not the raw secret,
 * so the secret never travels and replay is limited to the token TTL.
 */

import {
  createDraftToken,
  timingSafeEqualSecrets,
  verifyDraftToken,
} from '@core/draft-token'
import {
  DRAFT_COOKIE_MAX_AGE_SEC,
  DRAFT_COOKIE_NAME,
  DRAFT_HEADER_TOKEN_MAX_AGE_SEC,
  DRAFT_MODE_HEADER,
} from '@config/constants'

export { DRAFT_COOKIE_MAX_AGE_SEC, DRAFT_COOKIE_NAME, DRAFT_MODE_HEADER }

function getSecret(): string {
  return process.env.NEXT_DRAFT_MODE_SECRET ?? ''
}

/** Returns true iff the provided secret equals NEXT_DRAFT_MODE_SECRET (timing-safe). Use for /api/draft. */
export function isDraftSecretValid(secret: string | null | undefined): boolean {
  return timingSafeEqualSecrets(secret, getSecret())
}

/** Short-lived signed token for x-next-draft-mode header. Secret never sent; BFF verifies signature. */
export function getDraftModeHeaderValue(): string {
  return createDraftToken(getSecret(), DRAFT_HEADER_TOKEN_MAX_AGE_SEC)
}

/** Call from /api/draft only, after validating request secret. */
export function createDraftCookieValue(): string {
  return createDraftToken(getSecret(), DRAFT_COOKIE_MAX_AGE_SEC)
}

export function isDraftCookieValid(value: string | undefined): boolean {
  if (!value) {
    return false
  }
  const secret = getSecret()
  if (!secret) {
    return false
  }
  return verifyDraftToken(value, secret)
}

/** Cookie store shape: object with get(name) returning { value?: string }. Use with Next.js cookies() or similar. */
export function isDraftModeFromCookies(cookieStore: {
  get(name: string): { value?: string } | undefined
}): boolean {
  const value = cookieStore.get(DRAFT_COOKIE_NAME)?.value
  return isDraftCookieValid(value)
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

/** Server-only: true iff the signed draft cookie is present and valid. */
export async function isDraftModeEnabled(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return isDraftModeFromCookies(cookieStore)
}
