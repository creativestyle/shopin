import { NextRequest, NextResponse } from 'next/server'
import { I18N_CONFIG, getLocale } from '@config/constants'
import { isSafeDraftRedirectPath, PREVIEW_TOKEN_COOKIE } from '@/lib/draft-mode'

const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/**
 * Exit draft preview: clears the preview_token cookie and 307-redirects to a clean path.
 *
 * The edge proxy can only check the cookie's exp, not its HMAC signature (no Node crypto in
 * the edge bundle), so a forged/stale cookie funnels every request into /preview. The preview
 * page detects the bad signature and redirects here — a Server Component cannot clear an
 * HttpOnly cookie, only a route handler can. Once the cookie is gone, the redirected clean URL
 * routes normally. Also usable as an explicit "exit preview" action for editors.
 *
 * Query params: `locale` and `slug` describe where to return. The target is validated with
 * isSafeDraftRedirectPath to block open-redirect/path-traversal; anything unsafe falls back to
 * the site root. The default locale prefix is omitted to match intlMiddleware's
 * localePrefix:'as-needed' and avoid a needless extra redirect hop.
 */
export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const locale = searchParams.get('locale') ?? ''
  const slug = (searchParams.get('slug') ?? '').replace(/^\/+|\/+$/g, '')

  let target = '/'
  if (locale && isSafeDraftRedirectPath(locale, slug)) {
    if (locale === defaultLocalePrefix) {
      target = slug ? `/${slug}` : '/'
    } else {
      target = slug ? `/${locale}/${slug}` : `/${locale}`
    }
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = target
  redirectUrl.search = ''

  const response = NextResponse.redirect(redirectUrl, 307)
  // Clear with the same name/path the cookie was set with (path:'/').
  response.cookies.set({
    name: PREVIEW_TOKEN_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  })
  return response
}
