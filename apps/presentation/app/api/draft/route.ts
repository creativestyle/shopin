import { NextRequest, NextResponse } from 'next/server'
import { rfcToUrlPrefix, I18N_CONFIG, getLocale } from '@config/constants'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import {
  createPreviewToken,
  isDraftSecretValid,
  isSafeDraftRedirectPath,
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@/lib/draft-mode'

const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

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
 * page validates it and renders draft content. The token is not stripped from the address
 * bar — this is safe given the short TTL and signature, and only occurs in local dev.
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

  // Delivery strategy is keyed on the redirect base protocol (a server-controlled config value),
  // not the incoming request's x-forwarded-proto header (which could be spoofed/misconfigured).
  // Production always sets FRONTEND_URL to an https:// URL, so URL-param delivery is local-only.
  // On HTTPS redirect base: deliver token via HttpOnly cookie so it never appears in URLs or logs.
  // SameSite=None is required for the Contentful cross-site iframe context.
  // Note: Chrome's CHIPS proposal may eventually require adding `partitioned: true` for
  // third-party iframe cookies; monitor browser compatibility if preview breaks on new Chrome.
  // On HTTP redirect base (local dev): SameSite=None;Secure is unavailable, fall back to URL param.
  const redirectIsHttps = new URL(redirectBase).protocol === 'https:'

  const redirectUrl = new URL(previewPath, redirectBase)

  if (redirectIsHttps) {
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
  return NextResponse.redirect(redirectUrl, 307)
}
