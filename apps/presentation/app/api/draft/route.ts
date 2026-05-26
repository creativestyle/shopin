import { NextRequest, NextResponse } from 'next/server'
import { rfcToUrlPrefix } from '@config/constants'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import {
  createPreviewToken,
  isDraftSecretValid,
  isSafeDraftRedirectPath,
  PREVIEW_TOKEN_COOKIE,
} from '@/lib/draft-mode'

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
 * Validates secret and slug, generates a short-lived signed token, then redirects to
 * /<locale>/preview/<slug>?token=<token>. The preview route validates the token before
 * fetching draft content; live routes are never involved and remain ISR-cacheable.
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
  const previewPath = `/${locale}/preview/${normalizedSlug}`
  const redirectBase = getDraftRedirectBase(request)
  const response = NextResponse.redirect(
    new URL(previewPath, redirectBase),
    307
  )
  response.cookies.set({
    name: PREVIEW_TOKEN_COOKIE,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    // no maxAge → session cookie, cleared when browser closes
  })
  return response
}
