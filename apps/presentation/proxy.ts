import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { I18N_CONFIG, listLocales, getLocale } from '@config/constants'
import { AcceptLanguageUtils } from '@core/i18n'
import { isPreviewTokenValid, PREVIEW_TOKEN_COOKIE } from '@/lib/draft-mode'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'

const intlMiddleware = createMiddleware({
  locales: listLocales().map((l) => l.urlPrefix),
  defaultLocale: getLocale(I18N_CONFIG.defaultLocale).urlPrefix,
  localePrefix: 'as-needed',
  localeDetection: true,
})

const knownLocalePrefixes = new Set(listLocales().map((l) => l.urlPrefix))

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

  // Preview session: rewrite live paths → /preview/ so editors can browse the draft site.
  // Token stays in an HttpOnly cookie — never in the URL.
  const previewToken = request.cookies.get(PREVIEW_TOKEN_COOKIE)?.value
  if (previewToken && isPreviewTokenValid(previewToken)) {
    const segments = pathname.split('/').filter(Boolean)
    const locale = segments[0]
    const isPreviewPath = segments[1] === 'preview'

    if (locale && knownLocalePrefixes.has(locale) && !isPreviewPath) {
      const slugPath = segments.slice(1).join('/')
      const url = request.nextUrl.clone()
      url.pathname = slugPath
        ? `/${locale}/preview/${slugPath}`
        : `/${locale}/preview/${getHomepageSlugForLocale(locale)}`
      return NextResponse.rewrite(url)
    }
  }

  return intlMiddleware(request)
}

export const config = {
  // Match only internationalized pathnames, exclude static assets and API routes
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}
