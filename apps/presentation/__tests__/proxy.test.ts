/**
 * @jest-environment node
 *
 * Tests for apps/presentation/proxy.ts — the Next.js middleware that:
 *  1. Canonicalizes any variant-segment URL (308) — the [variant] segment is internal only
 *  2. Handles root / and /<locale> routing with ISR variant-key rewriting
 *  3. Routes /preview/… paths to the internal preview route (path-based detection)
 *  4. Falls through to next-intl for locale-detection redirects
 */
import { NextRequest, NextResponse } from 'next/server'

// ─── Mock: next-intl/middleware ───────────────────────────────────────────────
// createMiddleware is called at proxy module-load time and returns intlMiddleware.
// We expose the inner jest.fn() as __fn on the module so tests can configure it.
jest.mock('next-intl/middleware', () => {
  const fn = jest.fn()
  return { __esModule: true, default: jest.fn(() => fn), __fn: fn }
})

// ─── Mock: draft-mode ────────────────────────────────────────────────────────
jest.mock('@/lib/draft-mode', () => ({
  PREVIEW_TOKEN_COOKIE: 'preview_token',
  PREVIEW_TOKEN_INTERNAL_PARAM: '__pt',
  DRAFT_COOKIE_MAX_AGE_SEC: 86400,
}))

// ─── Mock: logger-config ─────────────────────────────────────────────────────
jest.mock('@core/logger-config', () => ({
  generateCorrelationId: jest.fn(),
  isValidCorrelationId: jest.fn(),
}))

// ─── System under test ───────────────────────────────────────────────────────
// Import AFTER mocks so the module picks up our mock for createMiddleware.
import proxy from '../proxy'

// ─── Constants (real values from @config/constants) ──────────────────────────
const DEFAULT_VARIANT = '~commercetools-set'
const ALT_VARIANT = '~commercetools-algolia-set'
const BASE = 'http://localhost'

// Preview tokens used across preview tests. Computed once at module load time;
// ACTIVE has a 1-hour future exp so isDraftTokenActiveByExp returns true.
// EXPIRED has a past exp so isDraftTokenActiveByExp returns false.
const ACTIVE_PREVIEW_TOKEN = `${Math.floor(Date.now() / 1000) + 3600}.fakesig`
const EXPIRED_PREVIEW_TOKEN = `${Math.floor(Date.now() / 1000) - 1}.fakesig`

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a NextRequest. Cookies are set via the `cookie` header. */
function makeRequest(
  path: string,
  opts: {
    cookie?: string
    acceptLanguage?: string
    correlationId?: string
  } = {}
): NextRequest {
  const headers: Record<string, string> = {}
  if (opts.cookie) {
    headers['cookie'] = opts.cookie
  }
  if (opts.acceptLanguage) {
    headers['accept-language'] = opts.acceptLanguage
  }
  if (opts.correlationId) {
    headers['x-correlation-id'] = opts.correlationId
  }
  return new NextRequest(`${BASE}${path}`, { headers })
}

/** Extract the pathname from the x-middleware-rewrite header set by NextResponse.rewrite(). */
function rewritePath(response: Response): string | null {
  const raw = response.headers.get('x-middleware-rewrite')
  if (!raw) {
    return null
  }
  try {
    return new URL(raw).pathname
  } catch {
    return raw
  }
}

/** Extract the pathname from the Location header (redirects). */
function redirectPath(response: Response): string | null {
  const raw = response.headers.get('location')
  if (!raw) {
    return null
  }
  try {
    return new URL(raw).pathname
  } catch {
    return raw
  }
}

// ─── Mock accessors ──────────────────────────────────────────────────────────

function getIntlMiddlewareFn() {
  return (jest.requireMock('next-intl/middleware') as any).__fn as jest.Mock
}
function getGenerateCorrelationId() {
  return jest.requireMock('@core/logger-config')
    .generateCorrelationId as jest.Mock
}
function getIsValidCorrelationId() {
  return jest.requireMock('@core/logger-config')
    .isValidCorrelationId as jest.Mock
}

// ─── Setup / teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  // Default: correlation IDs are invalid → always generate a fresh one
  getIsValidCorrelationId().mockReturnValue(false)
  getGenerateCorrelationId().mockReturnValue('gen-id')
  // Default: intl middleware returns a plain next() response (no redirect, no rewrite)
  getIntlMiddlewareFn().mockReturnValue(NextResponse.next())
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Variant-segment guard — 308 canonicalisation
// ─────────────────────────────────────────────────────────────────────────────
// The [variant] segment is an internal implementation detail and must never appear
// in public URLs. Any request with a known variant segment (default or alt) is
// 308-redirected to the canonical clean path.

describe('variant-segment guard (308 canonicalisation)', () => {
  it('308 redirects the default variant segment with a trailing path', () => {
    const res = proxy(makeRequest(`/${DEFAULT_VARIANT}/en/foo`))
    expect(res.status).toBe(308)
    expect(redirectPath(res)).toBe('/en/foo')
  })

  it('308 redirects the default variant segment with no trailing path to /', () => {
    const res = proxy(makeRequest(`/${DEFAULT_VARIANT}`))
    expect(res.status).toBe(308)
    expect(redirectPath(res)).toBe('/')
  })

  it('308 redirects the alt variant segment with a trailing path', () => {
    const res = proxy(makeRequest(`/${ALT_VARIANT}/en/foo`))
    expect(res.status).toBe(308)
    expect(redirectPath(res)).toBe('/en/foo')
  })

  it('308 redirects the alt variant segment with no trailing path to /', () => {
    const res = proxy(makeRequest(`/${ALT_VARIANT}`))
    expect(res.status).toBe(308)
    expect(redirectPath(res)).toBe('/')
  })

  it('does NOT redirect when the first segment has no ~ prefix', () => {
    const res = proxy(makeRequest('/en/foo'))
    expect(res.status).not.toBe(308)
  })

  it('308 redirects when ~ prefix is present even if value is not in the allowed list', () => {
    // Any ~-prefixed segment is an internal marker and must never appear in public URLs.
    // hasVariantPrefix catches bogus values that isVariantSegment would miss.
    const res = proxy(makeRequest('/~bogus/en/foo'))
    expect(res.status).toBe(308)
    expect(redirectPath(res)).toBe('/en/foo')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Root path routing
// ─────────────────────────────────────────────────────────────────────────────

describe('root path', () => {
  it('rewrites to /<variant>/en when accept-language matches default locale', () => {
    // Must be a rewrite, never a redirect: intlMiddleware ('as-needed') sends
    // /en back to /, so a / → /en redirect would loop infinitely.
    const res = proxy(makeRequest('/', { acceptLanguage: 'en-US' }))
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en`)
  })

  it('calls intlMiddleware and returns its response when accept-language is non-default', () => {
    const intlRes = NextResponse.redirect(`${BASE}/de`)
    intlRes.headers.set('location', `${BASE}/de`)
    getIntlMiddlewareFn().mockReturnValue(intlRes)
    const res = proxy(makeRequest('/', { acceptLanguage: 'de-DE' }))
    expect(getIntlMiddlewareFn()).toHaveBeenCalled()
    expect(res.headers.get('location')).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Preview path routing — path-based detection (no cookie needed)
// ─────────────────────────────────────────────────────────────────────────────
// The proxy detects preview by path shape (/preview/… or /{locale}/preview/…).
// The token is validated by the preview page, not the middleware.

describe('preview path routing — default locale', () => {
  it('rewrites /preview/slug to /<default-variant>/en/preview/slug', () => {
    const res = proxy(makeRequest('/preview/slug'))
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/preview/slug`)
  })

  it('uses default variant even when a data-source cookie is present', () => {
    const res = proxy(
      makeRequest('/preview/slug', {
        cookie: 'data-source=commercetools-algolia-set',
      })
    )
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/preview/slug`)
  })

  it('passes through ?__pt= from the incoming URL (HTTP dev path)', () => {
    const res = proxy(makeRequest('/preview/slug?__pt=signed-abc'))
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBe('signed-abc')
  })

  it('injects __pt from the preview_token cookie (HTTPS production path)', () => {
    // Token must pass isDraftTokenActiveByExp: "${exp}.${sig}" format with future exp.
    const res = proxy(
      makeRequest('/preview/slug', {
        cookie: `preview_token=${ACTIVE_PREVIEW_TOKEN}`,
      })
    )
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBe(ACTIVE_PREVIEW_TOKEN)
  })

  it('has no __pt param when neither URL param nor cookie is present', () => {
    const res = proxy(makeRequest('/preview/slug'))
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBeNull()
  })

  it('calls intlMiddleware for preview paths to preserve its response headers', () => {
    proxy(makeRequest('/preview/slug'))
    expect(getIntlMiddlewareFn()).toHaveBeenCalledTimes(1)
  })
})

describe('preview path routing — explicit locale', () => {
  it('rewrites /de/preview/slug to /<default-variant>/de/preview/slug', () => {
    const res = proxy(makeRequest('/de/preview/slug'))
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/de/preview/slug`)
  })

  it('calls intlMiddleware for preview paths to preserve its response headers', () => {
    proxy(makeRequest('/de/preview/slug'))
    expect(getIntlMiddlewareFn()).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Cookie-driven preview — clean /locale/... paths (isDraftActive=true)
// ─────────────────────────────────────────────────────────────────────────────
// When the user holds an active preview_token cookie and navigates to a clean
// /locale/page URL (not explicitly a /preview/ path), the proxy injects /preview/
// so they remain in draft mode during in-app navigation (#12).
// Token must pass isDraftTokenActiveByExp: format "${exp}.${sig}" with future exp.

describe('cookie-driven preview — clean /locale/... path (isDraftActive=true)', () => {
  it('rewrites /en/about-us to /<variant>/en/preview/about-us when draft cookie is active', () => {
    const res = proxy(
      makeRequest('/en/about-us', {
        cookie: `preview_token=${ACTIVE_PREVIEW_TOKEN}`,
      })
    )
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/preview/about-us`)
  })

  it('injects the active cookie token as __pt in the rewrite URL', () => {
    const res = proxy(
      makeRequest('/en/about-us', {
        cookie: `preview_token=${ACTIVE_PREVIEW_TOKEN}`,
      })
    )
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBe(ACTIVE_PREVIEW_TOKEN)
  })

  it('rewrites /de/about-us to /<variant>/de/preview/about-us when draft cookie is active', () => {
    const res = proxy(
      makeRequest('/de/about-us', {
        cookie: `preview_token=${ACTIVE_PREVIEW_TOKEN}`,
      })
    )
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/de/preview/about-us`)
  })

  it('does NOT route to preview when the cookie token is expired', () => {
    const res = proxy(
      makeRequest('/en/about-us', {
        cookie: `preview_token=${EXPIRED_PREVIEW_TOKEN}`,
      })
    )
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/about-us`)
  })

  it('does NOT route to preview for forged far-future exp tokens (self-DoS protection)', () => {
    const farFutureToken = '99999999999.fakedsig'
    const res = proxy(
      makeRequest('/en/about-us', { cookie: `preview_token=${farFutureToken}` })
    )
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/about-us`)
  })

  it('prefers URL param over an expired session cookie (editor opens fresh CMS link)', () => {
    // Fix 1 regression guard: expired cookie must not shadow a fresh ?__pt= link.
    const res = proxy(
      makeRequest('/preview/slug?__pt=fresh-url-token', {
        cookie: `preview_token=${EXPIRED_PREVIEW_TOKEN}`,
      })
    )
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBe('fresh-url-token')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. intlMiddleware fallthrough paths
// ─────────────────────────────────────────────────────────────────────────────

describe('intlMiddleware fallthrough', () => {
  it('passes through a redirect response from intlMiddleware (locale detection)', () => {
    const intlRes = NextResponse.redirect(`${BASE}/en/foo`)
    getIntlMiddlewareFn().mockReturnValue(intlRes)
    const res = proxy(makeRequest('/foo'))
    // Should be a redirect, not a rewrite
    expect(res.headers.get('location')).toContain('/en/foo')
  })

  it('does NOT pass through intlMiddleware redirect when draft cookie is active', () => {
    // proxy.ts guards redirect passthrough with !ctx.isPreview. This test ensures
    // the guard stays in place: preview users must never receive a locale-detection
    // redirect that would silently exit their draft session.
    const intlRes = NextResponse.redirect(`${BASE}/en/foo`)
    getIntlMiddlewareFn().mockReturnValue(intlRes)
    const res = proxy(
      makeRequest('/foo', { cookie: `preview_token=${ACTIVE_PREVIEW_TOKEN}` })
    )
    // Must be a preview rewrite (200), not the intlMiddleware redirect (3xx).
    // rewritePath() is non-null iff x-middleware-rewrite is present — verifies
    // handlePreviewPath ran instead of the redirect passthrough.
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/preview/foo`)
    expect(res.status).toBe(200)
  })

  it('rewrites /en/product to /<variant>/en/product when intl returns no rewrite', () => {
    const res = proxy(makeRequest('/en/product'))
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/product`)
  })

  it('rewrites /foo/bar (no locale) to /<variant>/en/foo/bar', () => {
    const res = proxy(makeRequest('/foo/bar'))
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/foo/bar`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. Correlation ID propagation
// ─────────────────────────────────────────────────────────────────────────────

describe('correlation ID', () => {
  it('generates a new correlation ID when the existing one is absent or invalid', () => {
    getIsValidCorrelationId().mockReturnValue(false)
    proxy(makeRequest('/en/page', { correlationId: 'invalid' }))
    expect(getGenerateCorrelationId()).toHaveBeenCalled()
  })

  it('reuses the existing correlation ID when it is valid', () => {
    getIsValidCorrelationId().mockReturnValue(true)
    proxy(makeRequest('/en/page', { correlationId: 'existing-id' }))
    expect(getGenerateCorrelationId()).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cookie-based variant — internal rewrite, clean public URL
// ─────────────────────────────────────────────────────────────────────────────
// The data-source cookie (written by /setup) drives variant selection.
// The proxy rewrites internally to the variant route but keeps the browser URL
// clean — no redirect, just an internal Next.js rewrite that partitions the ISR cache.

describe('cookie-based variant (internal rewrite, clean URL)', () => {
  it('rewrites to alt-variant internally when the non-default cookie is present', () => {
    const res = proxy(
      makeRequest('/en/product', {
        cookie: 'data-source=commercetools-algolia-set',
      })
    )
    expect(res.status).not.toBe(302)
    expect(rewritePath(res)).toBe(`/${ALT_VARIANT}/en/product`)
  })

  it('rewrites to default-variant when the default data-source cookie is present', () => {
    const res = proxy(
      makeRequest('/en/product', { cookie: 'data-source=commercetools-set' })
    )
    expect(res.status).not.toBe(302)
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/product`)
  })

  it('rewrites to default-variant when no data-source cookie is present', () => {
    const res = proxy(makeRequest('/en/product'))
    expect(res.status).not.toBe(302)
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/en/product`)
  })

  it('rewrites a default-locale unprefixed path to the alt-variant internal route', () => {
    const res = proxy(
      makeRequest('/setup', { cookie: 'data-source=commercetools-algolia-set' })
    )
    expect(res.status).not.toBe(302)
    expect(rewritePath(res)).toBe(`/${ALT_VARIANT}/en/setup`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. x-next-intl-locale forwarding
// ─────────────────────────────────────────────────────────────────────────────
// The next-intl plugin reads x-next-intl-locale from request headers to populate
// requestLocale in getRequestConfig. Without it, translations fall back to the
// default (English) locale even when browsing /de/... pages.

describe('x-next-intl-locale forwarding', () => {
  it('sets x-next-intl-locale to the explicit locale for /de/... paths', () => {
    const res = proxy(makeRequest('/de/page'))
    expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
      'de'
    )
  })

  it('sets x-next-intl-locale to the default locale for unprefixed paths', () => {
    const res = proxy(makeRequest('/page'))
    expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
      'en'
    )
  })

  it('sets x-next-intl-locale to the default locale for /en/... paths', () => {
    const res = proxy(makeRequest('/en/page'))
    expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
      'en'
    )
  })

  it('reads locale from intlMiddleware x-middleware-rewrite when present', () => {
    // Production intlMiddleware returns a rewrite (with x-middleware-rewrite) for
    // locale-prefixed paths. Its rewrite URL has the locale in position [1] but
    // no variant prefix (the variant prefix is added by our proxy, not intlMiddleware).
    // The default mock returns NextResponse.next() with no rewrite, so the
    // locale-from-rewrite branch in buildRequestContext is exercised only here.
    const intlRes = NextResponse.next()
    intlRes.headers.set('x-middleware-rewrite', `${BASE}/de/page`)
    getIntlMiddlewareFn().mockReturnValue(intlRes)
    const res = proxy(makeRequest('/page'))
    // /page request URL would resolve to default locale 'en'; the rewrite says 'de'
    expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
      'de'
    )
  })

  describe('x-next-intl-locale forwarding — preview paths', () => {
    it('sets x-next-intl-locale to the default locale for /preview/... paths', () => {
      const res = proxy(makeRequest('/preview/slug'))
      expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
        'en'
      )
    })

    it('sets x-next-intl-locale to de for /de/preview/... paths', () => {
      const res = proxy(makeRequest('/de/preview/slug'))
      expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
        'de'
      )
    })

    it('sets x-next-intl-locale for cookie-driven preview on /de/... paths', () => {
      const res = proxy(
        makeRequest('/de/about-us', {
          cookie: `preview_token=${ACTIVE_PREVIEW_TOKEN}`,
        })
      )
      expect(res.headers.get('x-middleware-request-x-next-intl-locale')).toBe(
        'de'
      )
    })
  })
})
