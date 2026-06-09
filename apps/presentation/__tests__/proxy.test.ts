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

  it('does NOT redirect when ~ prefix is present but value is not in the allowed list', () => {
    const res = proxy(makeRequest('/~bogus/en/foo'))
    expect(res.status).not.toBe(308)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Root path routing
// ─────────────────────────────────────────────────────────────────────────────

describe('root path', () => {
  it('rewrites to /<variant>/en when accept-language matches default locale', () => {
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
    const res = proxy(
      makeRequest('/preview/slug', { cookie: 'preview_token=cookie-token' })
    )
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBe('cookie-token')
  })

  it('has no __pt param when neither URL param nor cookie is present', () => {
    const res = proxy(makeRequest('/preview/slug'))
    const raw = res.headers.get('x-middleware-rewrite') ?? ''
    const rewritten = new URL(raw)
    expect(rewritten.searchParams.get('__pt')).toBeNull()
  })

  it('does NOT call intlMiddleware for preview paths', () => {
    proxy(makeRequest('/preview/slug'))
    expect(getIntlMiddlewareFn()).not.toHaveBeenCalled()
  })
})

describe('preview path routing — explicit locale', () => {
  it('rewrites /de/preview/slug to /<default-variant>/de/preview/slug', () => {
    const res = proxy(makeRequest('/de/preview/slug'))
    expect(rewritePath(res)).toBe(`/${DEFAULT_VARIANT}/de/preview/slug`)
  })

  it('does NOT call intlMiddleware for preview paths', () => {
    proxy(makeRequest('/de/preview/slug'))
    expect(getIntlMiddlewareFn()).not.toHaveBeenCalled()
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
