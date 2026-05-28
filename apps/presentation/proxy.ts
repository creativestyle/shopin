import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import {
  I18N_CONFIG,
  listLocales,
  getLocale,
  CORRELATION_ID_HEADER,
} from '@config/constants'
import { AcceptLanguageUtils } from '@core/i18n'
import {
  generateCorrelationId,
  isValidCorrelationId,
} from '@core/logger-config'
import { isPreviewTokenValid, PREVIEW_TOKEN_COOKIE } from '@/lib/draft-mode'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'
import { resolveVary, encodeVary } from '@/lib/vary/vary-key'

const intlMiddleware = createMiddleware({
  locales: listLocales().map((l) => l.urlPrefix),
  defaultLocale: getLocale(I18N_CONFIG.defaultLocale).urlPrefix,
  localePrefix: 'as-needed',
  localeDetection: true,
})

const knownLocalePrefixes = new Set(listLocales().map((l) => l.urlPrefix))
const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/** Ensures responses carry Vary: Cookie so shared HTTP caches (CDN, proxy) do not
 *  serve one vary-key variant to a different user. All dimensions in VARY_DIMENSIONS
 *  must remain cookie-sourced for this to be correct. */
function withCookieVary(response: NextResponse): NextResponse {
  response.headers.set('Vary', 'Cookie')
  return response
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Propagate (or generate) a correlation ID as a request header so downstream
  // server components in dynamic routes can read it from headers() without the
  // middleware needing to call cookies(). ISR routes never call headers() so they
  // won't read it — this is intentional (ISR responses are not per-request).
  const existingCorrelationId = request.headers.get(CORRELATION_ID_HEADER)
  const correlationId =
    existingCorrelationId && isValidCorrelationId(existingCorrelationId)
      ? existingCorrelationId
      : generateCorrelationId()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId)

  const varyKey = encodeVary(resolveVary((n) => request.cookies.get(n)?.value))

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
      url.pathname = `/${varyKey}/${getLocale(language).urlPrefix}`
      return withCookieVary(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      )
    }
    // Non-default locale at root — let intlMiddleware redirect to /<locale>;
    // the browser follows the redirect and our middleware injects [vary] on the next pass.
    return withCookieVary(intlMiddleware(request))
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
        ? `/${varyKey}/${locale}/preview/${slugPath}`
        : `/${varyKey}/${locale}/preview/${getHomepageSlugForLocale(locale)}`
      return withCookieVary(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      )
    }
  }

  // For all remaining paths, run intlMiddleware and then inject the [vary] segment.
  const intlResponse = intlMiddleware(request)

  // If intlMiddleware issued a redirect (locale detection), let it through — the browser
  // follows the redirect and our middleware injects [vary] on the next pass.
  if (intlResponse.headers.get('location')) {
    return withCookieVary(intlResponse)
  }

  // Determine the target pathname — intlMiddleware may have rewritten the path.
  const rewriteHeader = intlResponse.headers.get('x-middleware-rewrite')
  const targetPathname = rewriteHeader
    ? new URL(rewriteHeader).pathname
    : pathname

  const segments = targetPathname.split('/').filter(Boolean)
  const localeSegment = segments[0]

  if (localeSegment && knownLocalePrefixes.has(localeSegment)) {
    // Path has an explicit locale prefix: /en/foo → /${varyKey}/en/foo
    const url = request.nextUrl.clone()
    url.pathname = `/${varyKey}/${segments.join('/')}`
    return withCookieVary(
      NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    )
  }

  // Default locale path without prefix: /foo/bar → /${varyKey}/${defaultLocale}/foo/bar
  const url = request.nextUrl.clone()
  url.pathname =
    segments.length > 0
      ? `/${varyKey}/${defaultLocalePrefix}/${segments.join('/')}`
      : `/${varyKey}/${defaultLocalePrefix}`
  return withCookieVary(
    NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  )
}

export const config = {
  // Match only internationalized pathnames, exclude static assets, API routes,
  // and internal vary-key rewrite targets (~ prefix) so the proxy does not
  // re-run on its own rewrites and create a redirect loop.
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|images|~|.*\\.).*)',
  ],
}
