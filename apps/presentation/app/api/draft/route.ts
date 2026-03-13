import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { rfcToUrlPrefix } from '@config/constants'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import {
  createDraftCookieValue,
  DRAFT_COOKIE_MAX_AGE_SEC,
  DRAFT_COOKIE_NAME,
  isDraftSecretValid,
  isSafeDraftRedirectPath,
} from '@/lib/draft-mode'
import { logger } from '@/lib/logger'

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
 * Validates secret and slug, enables draft mode (sets signed cookie), then redirects to the page.
 * Cookie value is signed so only this endpoint can create a valid draft session; setting the
 * cookie manually does not grant preview access.
 *
 * Cookie is set explicitly on the redirect response so it is sent to the client (Next.js
 * redirect can drop the cookie set by draftMode().enable()).
 */
export async function GET(request: NextRequest) {
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

  const draft = await draftMode()
  draft.enable()

  const path = `/${locale}/${normalizedSlug}`
  const redirectBase = getDraftRedirectBase(request)
  const res = NextResponse.redirect(new URL(path, redirectBase), 307)
  const cookieValue = createDraftCookieValue()
  if (cookieValue) {
    // SameSite=None + Secure so the cookie is set when the CMS opens preview in iframe or new tab (cross-site).
    res.cookies.set(DRAFT_COOKIE_NAME, cookieValue, {
      path: '/',
      httpOnly: true,
      sameSite: 'none',
      maxAge: DRAFT_COOKIE_MAX_AGE_SEC,
      secure: true,
    })
  } else {
    logger.warn(
      {},
      'createDraftCookieValue returned no value; draft cookie was not set'
    )
  }
  return res
}
