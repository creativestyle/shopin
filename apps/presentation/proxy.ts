import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import {
  I18N_CONFIG,
  listLocales,
  getLocale,
  ALLOWED_DATA_SOURCES,
  DEFAULT_DATA_SOURCE,
  CORRELATION_ID_HEADER,
  type DataSource,
} from '@config/constants'
import { AcceptLanguageUtils } from '@core/i18n'
import {
  generateCorrelationId,
  isValidCorrelationId,
} from '@core/logger-config'
import { isPreviewTokenValid, PREVIEW_TOKEN_COOKIE } from '@/lib/draft-mode'
import { getHomepageSlugForLocale } from '@/features/content/homepage-slug'

const intlMiddleware = createMiddleware({
  locales: listLocales().map((l) => l.urlPrefix),
  defaultLocale: getLocale(I18N_CONFIG.defaultLocale).urlPrefix,
  localePrefix: 'as-needed',
  localeDetection: true,
})

const knownLocalePrefixes = new Set(listLocales().map((l) => l.urlPrefix))
const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/** Cookie name for data-source selection (set by demo selector UI). */
const DATA_SOURCE_COOKIE = 'data-source'

function resolveDataSource(request: NextRequest): DataSource {
  const raw = request.cookies.get(DATA_SOURCE_COOKIE)?.value
  return raw && (ALLOWED_DATA_SOURCES as readonly string[]).includes(raw)
    ? (raw as DataSource)
    : DEFAULT_DATA_SOURCE
}

/** Ensures responses carry Vary: Cookie so shared HTTP caches (CDN, proxy) do not
 *  serve one user's data-source variant to a different user. */
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

  // Strip incoming /<dataSource>/... URLs — these are internal rewrite targets that
  // should never be publicly accessible. Redirect to the clean URL without the segment
  // so the browser re-enters middleware and gets the correct rewrite from the cookie.
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  if (
    firstSegment &&
    (ALLOWED_DATA_SOURCES as readonly string[]).includes(firstSegment)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/' + pathname.split('/').filter(Boolean).slice(1).join('/')
    return withCookieVary(NextResponse.redirect(url, 302))
  }

  const dataSource = resolveDataSource(request)

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
      url.pathname = `/${dataSource}/${getLocale(language).urlPrefix}`
      return withCookieVary(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      )
    }
    // Non-default locale at root — let intlMiddleware redirect to /<locale>;
    // the browser follows the redirect and our middleware injects [dataSource] on the next pass.
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
        ? `/${dataSource}/${locale}/preview/${slugPath}`
        : `/${dataSource}/${locale}/preview/${getHomepageSlugForLocale(locale)}`
      return withCookieVary(
        NextResponse.rewrite(url, { request: { headers: requestHeaders } })
      )
    }
  }

  // For all remaining paths, run intlMiddleware and then inject the [dataSource] segment.
  const intlResponse = intlMiddleware(request)

  // If intlMiddleware issued a redirect (locale detection), let it through — the browser
  // follows the redirect and our middleware injects [dataSource] on the next pass.
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
    // Path has an explicit locale prefix: /en/foo → /${dataSource}/en/foo
    const url = request.nextUrl.clone()
    url.pathname = `/${dataSource}/${segments.join('/')}`
    return withCookieVary(
      NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    )
  }

  // Default locale path without prefix: /foo/bar → /${dataSource}/${defaultLocale}/foo/bar
  const url = request.nextUrl.clone()
  url.pathname =
    segments.length > 0
      ? `/${dataSource}/${defaultLocalePrefix}/${segments.join('/')}`
      : `/${dataSource}/${defaultLocalePrefix}`
  return withCookieVary(
    NextResponse.rewrite(url, { request: { headers: requestHeaders } })
  )
}

export const config = {
  // Match only internationalized pathnames, exclude static assets and API routes
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}
