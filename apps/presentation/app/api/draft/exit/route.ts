import { NextRequest } from 'next/server'
import {
  I18N_CONFIG,
  getLocale,
  listLocales,
  PREVIEW_ACTIVE_COOKIE,
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@config/constants'
import { isSafeDraftRedirectPath, isSiteHttps } from '@/lib/draft-mode'
import { encodePathSegments, relativeRedirect } from '@/lib/relative-redirect'

const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix
const localePrefixes = new Set(listLocales().map((l) => l.urlPrefix))

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
 * Query params: `locale` and `slug` are control params describing where to return. `locale` must be
 * a configured URL prefix and the slug passes isSafeDraftRedirectPath; anything else falls back to
 * the site root. Slug segments are percent-encoded and relativeRedirect rejects any off-host
 * target. The default locale prefix is omitted to match intlMiddleware's localePrefix:'as-needed'
 * and avoid a needless extra redirect hop.
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
  if (localePrefixes.has(locale) && isSafeDraftRedirectPath(locale, slug)) {
    const path = slug ? `/${encodePathSegments(slug)}` : ''
    target = locale === defaultLocalePrefix ? path || '/' : `/${locale}${path}`
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
