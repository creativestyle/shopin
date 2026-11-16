import { NextRequest } from 'next/server'
import { I18N_CONFIG, getLocale } from '@config/constants'
import {
  isSafeDraftRedirectPath,
  isSiteHttps,
  PREVIEW_ACTIVE_COOKIE,
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@/lib/draft-mode'
import { relativeRedirect } from '@/lib/relative-redirect'

const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/**
 * Exit draft preview: clears the preview_token cookie and 307-redirects to a clean path.
 *
 * The proxy verifies the preview token (HMAC + exp) before routing, so a forged/stale cookie
 * no longer funnels clean URLs into /preview. But a leftover cookie can still surface on a direct
 * /preview/… visit; the preview page detects the missing/invalid token and redirects here to clear
 * it — a Server Component cannot clear an HttpOnly cookie, only a route handler can. Once the cookie
 * is gone, the redirected clean URL routes normally. Also usable as an explicit "exit preview"
 * action for editors.
 *
 * Query params: `locale` and `slug` are control params describing where to return. The target is
 * validated with isSafeDraftRedirectPath to block open-redirect/path-traversal; anything unsafe
 * falls back to the site root. The default locale prefix is omitted to match intlMiddleware's
 * localePrefix:'as-needed' and avoid a needless extra redirect hop.
 *
 * Any other query params are content state (collection page/sort/filter, product variantId) and
 * are preserved on the returned URL so a broken preview session drops the user back at the same
 * non-preview location. The preview token param is never echoed back onto a published URL.
 *
 * The redirect is path-only so the browser stays on the domain it called (request.nextUrl
 * holds the internal host behind a proxy, e.g. 0.0.0.0:8888).
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

  // Carry through the original content query params, dropping our control params and the token.
  const forwarded = new URLSearchParams(searchParams)
  forwarded.delete('locale')
  forwarded.delete('slug')
  forwarded.delete(PREVIEW_TOKEN_INTERNAL_PARAM)

  const query = forwarded.toString()
  const response = relativeRedirect(query ? `${target}?${query}` : target)
  // Mirror the set attributes so the clear also applies inside Contentful's cross-site iframe.
  const isHttps = isSiteHttps()
  response.cookies.set({
    name: PREVIEW_TOKEN_COOKIE,
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  })
  response.cookies.set({
    name: PREVIEW_ACTIVE_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
  })
  return response
}
