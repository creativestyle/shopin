import { NextRequest, NextResponse } from 'next/server'
import {
  rfcToUrlPrefix,
  I18N_CONFIG,
  getLocale,
  listLocales,
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@config/constants'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import {
  createPreviewToken,
  isDraftSecretValid,
  isSafeDraftRedirectPath,
  isSiteHttps,
  DRAFT_COOKIE_MAX_AGE_SEC,
} from '@/lib/draft-mode'
import { encodePathSegments, relativeRedirect } from '@/lib/relative-redirect'
import { PreviewRequest } from '@/lib/slots'

const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix
const localePrefixes = new Set(listLocales().map((l) => l.urlPrefix))

/**
 * Draft Mode endpoint for headless CMS preview.
 * The configured CMS reads its own preview request (the `PreviewRequest` slot its integration fills: which
 * parameters carry the secret, the slug and the locale); the secret itself is NEXT_DRAFT_MODE_SECRET, compared here.
 * Without a CMS preview the route answers 404.
 *
 * The CMS typically sends locale as en-US, de-DE, etc. We redirect to app URL prefix (en, de).
 * The redirect is path-only, so the browser stays on whichever domain the CMS called; the
 * server never needs to know its public host (behind a proxy it only sees e.g. 0.0.0.0:8888).
 * Token delivery strategy depends on the FRONTEND_URL protocol (domain is ignored):
 *
 * HTTPS (production): HttpOnly cookie with SameSite=None;Secure. Works in
 * the CMS's cross-site iframe. Token never appears in the URL, access logs, or Referer
 * headers. The proxy reads the cookie and injects it into the internal rewrite URL as ?__pt=.
 *
 * HTTP (local dev, e.g. FRONTEND_URL=http://localhost:3000 or unset):
 * URL param ?__pt=. SameSite=None;Secure requires HTTPS so cookies cannot be forwarded
 * cross-site on plain HTTP. The signed, short-lived token rides in the URL; the preview
 * page validates it and renders draft content. The StripPreviewToken client component
 * removes it from the address bar after hydration; the session cookie keeps the session
 * alive for subsequent navigations and reloads.
 */
export function GET(request: NextRequest) {
  if (!PreviewRequest) {
    return new NextResponse('Not found', { status: 404 })
  }
  const preview = PreviewRequest(
    request.nextUrl.searchParams,
    isDraftSecretValid
  )
  if (!preview) {
    return new NextResponse('Invalid token', { status: 401 })
  }
  const { slug, locale: localeParam } = preview

  if (!slug || !localeParam) {
    return new NextResponse('Missing slug or locale', { status: 400 })
  }

  // CMS preview typically sends en-US, de-DE; our app uses URL prefix en, de
  const locale = rfcToUrlPrefix(localeParam)
  if (!localePrefixes.has(locale)) {
    return new NextResponse('Invalid slug or locale', { status: 400 })
  }

  // Normalize slug: trim slashes; empty slug → locale homepage (e.g. en→homepage, de→startseite)
  const normalizedSlug =
    slug.replace(/^\/+|\/+$/g, '').trim() || getHomepageSlugForLocale(locale)

  if (!isSafeDraftRedirectPath(locale, normalizedSlug)) {
    return new NextResponse('Invalid slug or locale', { status: 400 })
  }

  const token = createPreviewToken()
  // Omit the default locale prefix — intlMiddleware would strip it anyway (localePrefix: 'as-needed').
  const encodedSlug = encodePathSegments(normalizedSlug)
  const previewPath =
    locale === defaultLocalePrefix
      ? `/preview/${encodedSlug}`
      : `/${locale}/preview/${encodedSlug}`

  // Delivery is keyed on the FRONTEND_URL protocol (server-controlled), not on request headers
  // (x-forwarded-host/proto can be spoofed). On HTTPS we always use the SameSite=None;Secure
  // cookie — never the URL — so the token can't leak to logs/Referer even behind an HTTP ingress.
  if (isSiteHttps()) {
    const response = relativeRedirect(previewPath)
    response.cookies.set({
      name: PREVIEW_TOKEN_COOKIE,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: DRAFT_COOKIE_MAX_AGE_SEC,
    })
    return response
  }

  const query = new URLSearchParams({ [PREVIEW_TOKEN_INTERNAL_PARAM]: token })
  const response = relativeRedirect(`${previewPath}?${query}`)
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
