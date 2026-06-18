import { NextRequest, NextResponse } from 'next/server'
import { rfcToUrlPrefix, I18N_CONFIG, getLocale } from '@config/constants'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import {
  createPreviewToken,
  isDraftSecretValid,
  isSafeDraftRedirectPath,
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
  DRAFT_COOKIE_MAX_AGE_SEC,
} from '@/lib/draft-mode'

const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/**
 * Resolves the public-facing host of the incoming request. Prefers the
 * x-forwarded-host header (set by a reverse proxy) over the raw Host header so
 * the comparison with redirectBase is correct even behind a proxy where
 * request.nextUrl reflects the internal host.
 */
function getRequestPublicHost(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-host')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('host') ?? request.nextUrl.host
}

/**
 * Base URL for the draft redirect. Uses FRONTEND_URL so redirect always goes to the canonical site.
 * When unset (e.g. local dev), uses request origin and rewrites 0.0.0.0 → localhost.
 */
function getDraftRedirectBase(request: NextRequest): string {
  const base = process.env.FRONTEND_URL?.trim()?.replace(/\/$/, '')
  if (base) {
    return base
  }
  const url = new URL(request.nextUrl.origin)
  if (url.hostname === '0.0.0.0') {
    url.hostname = 'localhost'
  }
  return url.origin
}

/**
 * Draft Mode endpoint for headless CMS preview.
 * Secured by NEXT_DRAFT_MODE_SECRET; not a simple ?preview=true query.
 *
 * Usage from CMS: set draft/preview URL to
 * https://<your-site>/api/draft?secret=<NEXT_DRAFT_MODE_SECRET>&slug=<entry-slug>&locale=<locale>
 *
 * The CMS typically sends locale as en-US, de-DE, etc. We redirect to app URL prefix (en, de).
 * Token delivery strategy depends on the redirect base protocol (FRONTEND_URL when set):
 *
 * HTTPS redirect base (production): HttpOnly cookie with SameSite=None;Secure. Works in
 * Contentful's cross-site iframe. Token never appears in the URL, access logs, or Referer
 * headers. The proxy reads the cookie and injects it into the internal rewrite URL as ?__pt=.
 *
 * HTTP redirect base (local dev, e.g. FRONTEND_URL=http://localhost:3000 or unset):
 * URL param ?__pt=. SameSite=None;Secure requires HTTPS so cookies cannot be forwarded
 * cross-site on plain HTTP. The signed, short-lived token rides in the URL; the preview
 * page validates it and renders draft content. The StripPreviewToken client component
 * removes it from the address bar after hydration; the session cookie keeps the session
 * alive for subsequent navigations and reloads.
 */
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')
  const localeParam = searchParams.get('locale')

  if (!isDraftSecretValid(secret)) {
    return new NextResponse('Invalid token', { status: 401 })
  }

  if (!slug || !localeParam) {
    return new NextResponse('Missing slug or locale', { status: 400 })
  }

  // CMS preview typically sends en-US, de-DE; our app uses URL prefix en, de
  const locale = rfcToUrlPrefix(localeParam)

  // Normalize slug: trim slashes; empty slug → locale homepage (e.g. en→homepage, de→startseite)
  const normalizedSlug =
    slug.replace(/^\/+|\/+$/g, '').trim() || getHomepageSlugForLocale(locale)

  if (!isSafeDraftRedirectPath(locale, normalizedSlug)) {
    return new NextResponse('Invalid slug or locale', { status: 400 })
  }

  const token = createPreviewToken()
  const redirectBase = getDraftRedirectBase(request)
  // Omit the default locale prefix — intlMiddleware would strip it anyway (localePrefix: 'as-needed').
  const previewPath =
    locale === defaultLocalePrefix
      ? `/preview/${normalizedSlug}`
      : `/${locale}/preview/${normalizedSlug}`

  // Cookie delivery requires two conditions: the redirect base must be HTTPS (SameSite=None;Secure
  // is unavailable on plain HTTP), and the request's public host must match the redirect base host.
  // The host check is necessary because Set-Cookie is scoped to the responding host — if the CMS
  // calls /api/draft on an internal hostname the browser would store the cookie there, follow the
  // 307 to the canonical host without it, and the preview page would fail to load. When the hosts
  // differ the signed, short-lived URL param is used instead.
  // SameSite=None is required for the Contentful cross-site iframe context.
  // Note: Chrome's CHIPS proposal may eventually require adding `partitioned: true` for
  // third-party iframe cookies; monitor browser compatibility if preview breaks on new Chrome.
  const redirectUrl = new URL(previewPath, redirectBase)
  const parsedRedirectBase = new URL(redirectBase)
  const redirectIsHttps = parsedRedirectBase.protocol === 'https:'
  const hostMatchesRedirect =
    getRequestPublicHost(request) === parsedRedirectBase.host

  if (redirectIsHttps && hostMatchesRedirect) {
    const response = NextResponse.redirect(redirectUrl, 307)
    response.cookies.set({
      name: PREVIEW_TOKEN_COOKIE,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    })
    return response
  }

  redirectUrl.searchParams.set(PREVIEW_TOKEN_INTERNAL_PARAM, token)
  const response = NextResponse.redirect(redirectUrl, 307)
  // On HTTP, also set a SameSite=Lax HttpOnly cookie so the proxy can establish
  // a draft session and in-app navigation stays in draft mode after the initial
  // preview load. The __pt URL param is the primary entry credential; the cookie
  // persists the session. It cannot be SameSite=None;Secure here (requires HTTPS).
  response.cookies.set({
    name: PREVIEW_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    path: '/',
    maxAge: DRAFT_COOKIE_MAX_AGE_SEC,
    secure: false,
    sameSite: 'lax',
  })
  return response
}
