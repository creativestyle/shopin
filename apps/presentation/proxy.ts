import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { I18N_CONFIG, listLocales, getLocale } from '@config/constants'
import { AcceptLanguageUtils } from '@core/i18n'
import { DRAFT_COOKIE_NAME, isDraftCookieValid } from '@/lib/draft-mode'

const intlMiddleware = createMiddleware({
  locales: listLocales().map((l) => l.urlPrefix),
  defaultLocale: getLocale(I18N_CONFIG.defaultLocale).urlPrefix,
  localePrefix: 'as-needed',
  localeDetection: true,
})

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // intlMiddleware returns NextResponse.next() for the default locale at '/',
  // leaving the [locale] dynamic segment without a value → 404.
  // Rewrite internally to /en so the route matches; non-default locales (e.g. /de)
  // are handled by intlMiddleware's localeDetection redirect.
  if (pathname === '/' || pathname === '') {
    const language = AcceptLanguageUtils.getBestSupportedLanguage(
      request.headers.get('accept-language') ?? ''
    )
    if (language === I18N_CONFIG.defaultLocale) {
      const url = request.nextUrl.clone()
      url.pathname = `/${getLocale(language).urlPrefix}`
      return NextResponse.rewrite(url)
    }
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
