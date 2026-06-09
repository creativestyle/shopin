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
import {
  isVariantSegment,
  DEFAULT_VARIANT_SEGMENT,
  resolveVariant,
  encodeVariant,
} from '@/lib/variant/variant-key'
import {
  PREVIEW_TOKEN_COOKIE,
  PREVIEW_TOKEN_INTERNAL_PARAM,
} from '@/lib/draft-mode'

const intlMiddleware = createMiddleware({
  locales: listLocales().map((l) => l.urlPrefix),
  defaultLocale: getLocale(I18N_CONFIG.defaultLocale).urlPrefix,
  localePrefix: 'as-needed',
  localeDetection: true,
})

const knownLocalePrefixes = new Set(listLocales().map((l) => l.urlPrefix))
const defaultLocalePrefix = getLocale(I18N_CONFIG.defaultLocale).urlPrefix

/** Rewrite the request to the given internal pathname, forwarding the mutated
 *  request headers (correlation ID, etc.). */
function rewriteToVariant(
  request: NextRequest,
  internalPathname: string,
  requestHeaders: Headers
): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = internalPathname
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } })
}

/** Copy Set-Cookie headers from intlMiddleware's response into a rewrite response.
 *
 * intlMiddleware calls syncCookie() which sets NEXT_LOCALE when the active locale
 * differs from the browser's Accept-Language (e.g. an English-browser user visiting
 * /de/…). Our proxy discards the intlResponse for non-redirect paths and creates
 * its own rewrite — without this copy, NEXT_LOCALE is never sent to the browser,
 * so subsequent navigations to unprefixed paths (e.g. /p/bar) lose the locale. */
function propagateIntlCookies(
  intlResponse: Response,
  rewriteResponse: NextResponse
): NextResponse {
  const setCookie = intlResponse.headers.get('set-cookie')
  if (setCookie) {
    rewriteResponse.headers.set('set-cookie', setCookie)
  }
  return rewriteResponse
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

  // Compute segments once; reused by the variant-guard, preview block, and final routing.
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0] ?? ''

  // [variant]-segment guard: the segment is an internal implementation detail.
  //
  // proxy.ts rewrites every incoming clean URL (e.g. /en/foo) to an internal
  // URL that carries the active variant (~commercetools-set/en/foo or
  // ~commercetools-algolia-set/en/foo). Next.js keys its Full Route Cache on
  // this internal URL, giving each variant its own ISR entry.
  //
  // The segment must never appear in public URLs. If one leaks (bookmark,
  // bot, direct link) — default or alt variant alike — 308 to the clean path.
  // Next.js middleware never re-runs on its own rewrite targets, so our own
  // internal rewrites to /~…/ do NOT trigger this guard.
  if (isVariantSegment(firstSegment)) {
    const stripped = pathname.slice(1 + firstSegment.length) || '/'
    const url = request.nextUrl.clone()
    url.pathname = stripped
    return NextResponse.redirect(url, 308)
  }

  // Detect preview by path shape: /preview/slug (default-locale) or /{locale}/preview/slug.
  // Hoist firstIsLocale so the locale check is computed once and shared with the preview block.
  const firstIsLocale = !!firstSegment && knownLocalePrefixes.has(firstSegment)
  const isPreview =
    firstSegment === 'preview' || (firstIsLocale && segments[1] === 'preview')

  // Determine the active variant key from the data-source cookie.
  // Preview always uses the default variant — no A/B testing in editorial preview sessions.
  const variantKey = isPreview
    ? DEFAULT_VARIANT_SEGMENT
    : encodeVariant(resolveVariant((n) => request.cookies.get(n)?.value))

  // intlMiddleware returns NextResponse.next() for the default locale at '/',
  // leaving the [locale] dynamic segment without a value → 404.
  // Rewrite internally to /en so the route matches; non-default locales (e.g. /de)
  // are handled by intlMiddleware's localeDetection redirect.
  if (pathname === '/' || pathname === '') {
    const language = AcceptLanguageUtils.getBestSupportedLanguage(
      request.headers.get('accept-language') ?? ''
    )

    if (language === I18N_CONFIG.defaultLocale) {
      return rewriteToVariant(
        request,
        `/${variantKey}/${getLocale(language).urlPrefix}`,
        requestHeaders
      )
    }
    // Non-default locale at root — let intlMiddleware redirect to /<locale>;
    // the browser follows the redirect and our middleware injects [variant] on the next pass.
    return intlMiddleware(request)
  }

  // Preview paths (/preview/slug or /{locale}/preview/slug).
  // Skip intlMiddleware — locale-detection would redirect and break the preview flow.
  // On HTTPS the token arrives via cookie and is injected as ?__pt=; on HTTP it is
  // already in the URL and clone() carries it through. See /api/draft for rationale.
  if (isPreview) {
    const internalPathname = firstIsLocale
      ? `/${variantKey}/${segments.join('/')}`
      : `/${variantKey}/${defaultLocalePrefix}/${segments.join('/')}`
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = internalPathname
    const cookieToken = request.cookies.get(PREVIEW_TOKEN_COOKIE)?.value
    if (cookieToken) {
      rewriteUrl.searchParams.set(PREVIEW_TOKEN_INTERNAL_PARAM, cookieToken)
    }
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    })
  }

  // Call intlMiddleware solely for its locale-detection redirect side-effect.
  // Under localePrefix: 'as-needed', for explicit-locale and default-locale paths
  // the middleware issues no redirect — we compute the rewrite target directly
  // from the already-parsed segments to avoid coupling to the x-middleware-rewrite
  // internal header.
  const intlResponse = intlMiddleware(request)

  // intlMiddleware issued a locale-detection redirect (e.g. / → /de for a German
  // browser on a non-default locale). Let it through — the browser follows the
  // redirect and our middleware injects [variant] on the next pass.
  if (intlResponse.headers.get('location')) {
    return intlResponse
  }

  // Explicit-locale path: /en/foo → /${variantKey}/en/foo
  if (firstSegment && knownLocalePrefixes.has(firstSegment)) {
    return propagateIntlCookies(
      intlResponse,
      rewriteToVariant(
        request,
        `/${variantKey}/${segments.join('/')}`,
        requestHeaders
      )
    )
  }

  // Default-locale unprefixed path: /foo/bar → /${variantKey}/${defaultLocale}/foo/bar
  return propagateIntlCookies(
    intlResponse,
    rewriteToVariant(
      request,
      segments.length > 0
        ? `/${variantKey}/${defaultLocalePrefix}/${segments.join('/')}`
        : `/${variantKey}/${defaultLocalePrefix}`,
      requestHeaders
    )
  )
}

export const config = {
  // Match internationalized pathnames and variant-key URLs (redirected to
  // clean path). Excludes static assets and API routes. Next.js middleware
  // never re-runs on its own rewrite targets, so matching ~ paths does NOT
  // cause a redirect loop.
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}
