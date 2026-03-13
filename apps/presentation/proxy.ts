import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { I18N_CONFIG, URL_PREFIXES } from '@config/constants'
import { DRAFT_COOKIE_NAME, isDraftCookieValid } from '@/lib/draft-mode'

const intlMiddleware = createMiddleware({
  // Use the URL prefixes as locales
  locales: Object.values(URL_PREFIXES),
  defaultLocale: URL_PREFIXES[I18N_CONFIG.defaultLanguage],
  localePrefix: 'as-needed',
  localeDetection: true,
})

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // With localePrefix 'as-needed', next-intl returns NextResponse.next()
  // for the root path with the default locale, but the [locale] dynamic
  // segment has no value → 404.
  // Explicitly rewrite / → /defaultLocale so the route matches.
  if (pathname === '/' || pathname === '') {
    const defaultLocale = URL_PREFIXES[I18N_CONFIG.defaultLanguage]
    const url = request.nextUrl.clone()
    url.pathname = `/${defaultLocale}`
    return NextResponse.rewrite(url)
  }

  const response = intlMiddleware(request)
  // Draft mode: disable caching only when draft cookie is valid (signed + not expired)
  const draftCookieValue = request.cookies.get(DRAFT_COOKIE_NAME)?.value
  if (isDraftCookieValid(draftCookieValue)) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    )
    response.headers.set('Pragma', 'no-cache')
  }
  return response
}

export const config = {
  // Match only internationalized pathnames, exclude static assets and API routes
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}
