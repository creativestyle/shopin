/**
 * @jest-environment node
 */
/**
 * GET /api/draft is the CMS preview entry route. A CMS editor clicks a
 * "Preview" link in the CMS UI, which hits this route with a short-lived
 * secret + slug + locale. On success the route redirects the editor to the
 * live site's /preview/ path. Token delivery:
 *
 * HTTPS (production): HttpOnly SameSite=None;Secure cookie only — token never in URL.
 * HTTP / fallback: ?__pt= URL param + SameSite=Lax HttpOnly cookie.
 *   The URL param is the primary entry credential; the Lax cookie establishes a draft
 *   session so in-app navigation (to /en/…) continues to serve draft content.
 *
 * Slug normalisation and isSafeDraftRedirectPath guard against open-redirect attacks.
 */
import { NextRequest } from 'next/server'

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('@/lib/draft-mode', () => ({
  isDraftSecretValid: jest.fn(),
  isSafeDraftRedirectPath: jest.fn(),
  createPreviewToken: jest.fn(),
  isSiteHttps: jest.requireActual('@/lib/draft-mode').isSiteHttps,
  DRAFT_COOKIE_MAX_AGE_SEC: 86400,
}))

// The configured CMS's preview reader (the `PreviewRequest` slot): by default one with the usual parameters
// (secret, slug, locale), as the CMS integrations read theirs.
const mockSlots: { PreviewRequest?: unknown } = {}
// a getter: the route module loads before this file's constants are set
jest.mock('@/lib/slots', () => ({
  get PreviewRequest() {
    return mockSlots.PreviewRequest
  },
}))
const usualPreview = (
  query: URLSearchParams,
  secretMatches: (value: string | null) => boolean
) =>
  secretMatches(query.get('secret'))
    ? { slug: query.get('slug'), locale: query.get('locale') }
    : undefined

jest.mock('@/features/content/homepage-slug', () => ({
  getHomepageSlugForLocale: jest.fn(),
}))

// ─── System under test ───────────────────────────────────────────────────────

import { GET } from '../route'

// ─── Mock accessors ──────────────────────────────────────────────────────────

function draftModeMocks() {
  const m = jest.requireMock('@/lib/draft-mode') as {
    isDraftSecretValid: jest.Mock
    isSafeDraftRedirectPath: jest.Mock
    createPreviewToken: jest.Mock
  }
  return m
}

function homepageMock() {
  return (
    jest.requireMock('@/features/content/homepage-slug') as {
      getHomepageSlugForLocale: jest.Mock
    }
  ).getHomepageSlugForLocale
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(
  params: Record<string, string>,
  origin = 'https://shop.example.com',
  headers?: Record<string, string>
): NextRequest {
  const url = new URL('/api/draft', origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), headers ? { headers } : undefined)
}

function locationUrl(res: Response): URL {
  return new URL(res.headers.get('location') ?? '', 'http://placeholder')
}

function validParams() {
  return { secret: 'valid-secret', slug: 'products/shoe', locale: 'en-US' }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/draft', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Happy-path defaults
    draftModeMocks().isDraftSecretValid.mockReturnValue(true)
    draftModeMocks().isSafeDraftRedirectPath.mockReturnValue(true)
    draftModeMocks().createPreviewToken.mockReturnValue('signed-token-abc')
    homepageMock().mockReturnValue('homepage')
    process.env.FRONTEND_URL = 'https://shop.example.com'
    mockSlots.PreviewRequest = usualPreview
  })

  describe('the configured CMS reads its own preview request', () => {
    it('answers 404 when the CMS has no preview', async () => {
      mockSlots.PreviewRequest = undefined
      const res = GET(makeRequest(validParams()))
      expect(res.status).toBe(404)
      expect(draftModeMocks().createPreviewToken).not.toHaveBeenCalled()
    })

    it("takes the CMS's own parameter names; the secret is still SHOPin's check", () => {
      mockSlots.PreviewRequest = (
        query: URLSearchParams,
        secretMatches: (value: string | null) => boolean
      ) =>
        secretMatches(query.get('token'))
          ? { slug: query.get('path'), locale: query.get('lang') }
          : undefined
      const res = GET(
        makeRequest({ token: 'the-secret', path: 'about', lang: 'de-DE' })
      )
      expect(draftModeMocks().isDraftSecretValid).toHaveBeenCalledWith(
        'the-secret'
      )
      expect(locationUrl(res).pathname).toBe('/de/preview/about')
    })
  })

  // ─── Validation failures ──────────────────────────────────────────────

  describe('validation failures', () => {
    it('returns 401 when secret is invalid', async () => {
      draftModeMocks().isDraftSecretValid.mockReturnValue(false)
      const res = GET(makeRequest(validParams()))
      expect(res.status).toBe(401)
      expect(await res.text()).toBe('Invalid token')
    })

    it('returns 400 when slug param is missing', async () => {
      const { slug: _slug, ...rest } = validParams()
      const res = GET(makeRequest(rest))
      expect(res.status).toBe(400)
      expect(await res.text()).toBe('Missing slug or locale')
    })

    it('returns 400 when locale param is missing', async () => {
      const { locale: _locale, ...rest } = validParams()
      const res = GET(makeRequest(rest))
      expect(res.status).toBe(400)
      expect(await res.text()).toBe('Missing slug or locale')
    })

    it.each(['xx-XX', '\\evil.com', '/\\evil.com'])(
      'returns 400 for a locale that is not configured (%j)',
      async (locale) => {
        const res = GET(makeRequest({ ...validParams(), locale }))
        expect(res.status).toBe(400)
        expect(await res.text()).toBe('Invalid slug or locale')
      }
    )

    it('returns 400 when isSafeDraftRedirectPath returns false', async () => {
      draftModeMocks().isSafeDraftRedirectPath.mockReturnValue(false)
      const res = GET(makeRequest(validParams()))
      expect(res.status).toBe(400)
      expect(await res.text()).toBe('Invalid slug or locale')
    })
  })

  // ─── Slug normalisation ───────────────────────────────────────────────

  describe('slug normalisation', () => {
    it('strips leading and trailing slashes from the slug', async () => {
      const res = GET(
        makeRequest({ ...validParams(), slug: '/products/shoe/' })
      )
      expect(res.headers.get('location')).toContain('/preview/products/shoe')
    })

    it('uses getHomepageSlugForLocale when slug normalises to empty (e.g. just slashes)', async () => {
      homepageMock().mockReturnValue('homepage')
      // A slug of '///' passes the !slug guard but normalises to '' → homepage fallback.
      const res = GET(makeRequest({ ...validParams(), slug: '///' }))
      expect(res.headers.get('location')).toContain('/preview/homepage')
    })
  })

  describe('slug encoding', () => {
    it.each([
      ['de-DE', 'über-uns', '/de/preview/%C3%BCber-uns'],
      ['en-US', '日本', '/preview/%E6%97%A5%E6%9C%AC'],
    ])(
      'percent-encodes a non-ASCII slug (%s, %s)',
      (locale, slug, expected) => {
        const res = GET(makeRequest({ ...validParams(), locale, slug }))
        expect(res.status).toBe(307)
        expect(res.headers.get('location')).toBe(expected)
      }
    )

    it('keeps the HTTP token on the request origin for a backslash slug (real guard)', () => {
      delete process.env.FRONTEND_URL
      draftModeMocks().isSafeDraftRedirectPath.mockImplementation(
        jest.requireActual('@/lib/draft-mode').isSafeDraftRedirectPath
      )
      draftModeMocks().createPreviewToken.mockReturnValue('tok')
      const res = GET(makeRequest({ ...validParams(), slug: '\\evil.com' }))
      const url = new URL(res.headers.get('location') ?? '', 'http://shop.test')
      expect(url.origin).toBe('http://shop.test')
      expect(url.pathname).toBe('/preview/%5Cevil.com')
    })
  })

  // ─── Success path — HTTPS (production) ───────────────────────────────

  describe('success path on HTTPS', () => {
    // makeRequest uses https:// origin by default
    it('returns a 307 redirect', () => {
      const res = GET(makeRequest(validParams()))
      expect(res.status).toBe(307)
    })

    it('redirects to /preview/<slug> for default locale (en)', () => {
      const res = GET(makeRequest(validParams()))
      const location = res.headers.get('location') ?? ''
      expect(location).toMatch(/\/preview\/products\/shoe($|\?)/)
    })

    it('redirects to /<locale>/preview/<slug> for non-default locale (de)', () => {
      const res = GET(makeRequest({ ...validParams(), locale: 'de-DE' }))
      const location = res.headers.get('location') ?? ''
      expect(location).toMatch(/\/de\/preview\/products\/shoe($|\?)/)
    })

    it('sets the preview_token cookie as HttpOnly with SameSite=None', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams()))
      const cookie = res.headers.get('set-cookie') ?? ''
      expect(cookie).toContain('preview_token=my-signed-token')
      expect(cookie.toLowerCase()).toContain('httponly')
      expect(cookie.toLowerCase()).toContain('samesite=none')
    })

    it('HTTPS cookie includes Max-Age so it survives browser close (not a session cookie)', () => {
      // Fix 2 regression guard: the HTTPS branch previously omitted maxAge, making the
      // cookie session-scoped (cleared on browser close before the first preview page load).
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams()))
      const cookie = res.headers.get('set-cookie') ?? ''
      expect(cookie.toLowerCase()).toMatch(/max-age=\d+/)
    })

    it('does NOT put the token in the redirect URL on HTTPS', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams()))
      expect(res.headers.get('location')).not.toContain('my-signed-token')
    })
  })

  // ─── Success path — HTTP (local dev) ─────────────────────────────────

  describe('success path on HTTP', () => {
    beforeEach(() => {
      delete process.env.FRONTEND_URL
    })

    it('puts the token as ?__pt= in the redirect URL', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams(), 'http://localhost:3000'))
      expect(locationUrl(res).searchParams.get('__pt')).toBe('my-signed-token')
    })

    it('sets a SameSite=Lax HttpOnly cookie on HTTP alongside the __pt URL param', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams(), 'http://localhost:3000'))
      const cookie = res.headers.get('set-cookie') ?? ''
      expect(cookie).toContain('preview_token=my-signed-token')
      expect(cookie.toLowerCase()).toContain('httponly')
      expect(cookie.toLowerCase()).toContain('samesite=lax')
      // Must NOT be Secure (no TLS on HTTP)
      expect(cookie.toLowerCase()).not.toContain('; secure')
    })

    it('also puts the token in the URL when using the Lax-cookie HTTP path', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams(), 'http://localhost:3000'))
      expect(locationUrl(res).searchParams.get('__pt')).toBe('my-signed-token')
    })
  })

  // ─── Delivery is keyed on the redirect base, not request headers ──────

  describe('token delivery is keyed on the https redirect base, not the request host', () => {
    it('uses cookie (not URL param) when FRONTEND_URL is https:// even if the request is HTTP', () => {
      // Security invariant: delivery mode is keyed on the redirect base (a server-controlled
      // config value), not the incoming request's headers (which can be spoofed). A production
      // deploy reached over an HTTP-only internal ingress must never leak the token into the URL.
      process.env.FRONTEND_URL = 'https://shop.example.com'
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams(), 'http://internal-host'))
      expect(res.headers.get('set-cookie')).toContain('my-signed-token')
      expect(res.headers.get('location')).not.toContain('my-signed-token')
    })

    it('uses cookie regardless of a non-matching x-forwarded-host (the header is not trusted for delivery mode)', () => {
      // The spoofable x-forwarded-host must not downgrade an HTTPS deploy to URL-param delivery.
      process.env.FRONTEND_URL = 'https://shop.example.com'
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(
        makeRequest(validParams(), 'http://internal-host', {
          'x-forwarded-host': 'other.example.com',
        })
      )
      expect(res.headers.get('set-cookie')).toContain('my-signed-token')
      expect(res.headers.get('location')).not.toContain('my-signed-token')
    })

    it('uses cookie when request origin host matches https FRONTEND_URL (no proxy headers)', () => {
      process.env.FRONTEND_URL = 'https://shop.example.com'
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams(), 'https://shop.example.com'))
      expect(res.headers.get('set-cookie')).toContain('my-signed-token')
      expect(res.headers.get('location')).not.toContain('my-signed-token')
    })
  })

  // ─── Redirect target ──────────────────────────────────────────────────

  describe('redirect target', () => {
    it('is path-only so the browser stays on the domain the CMS called', () => {
      const res = GET(makeRequest(validParams(), 'http://0.0.0.0:8888'))
      expect(res.headers.get('location')).toBe('/preview/products/shoe')
    })

    it('ignores the FRONTEND_URL domain (multi-domain deployments)', () => {
      process.env.FRONTEND_URL = 'https://other-domain.example.com'
      const res = GET(makeRequest({ ...validParams(), locale: 'de-DE' }))
      expect(res.headers.get('location')).toBe('/de/preview/products/shoe')
    })

    it('keeps the HTTP token param on the path-only redirect', () => {
      delete process.env.FRONTEND_URL
      draftModeMocks().createPreviewToken.mockReturnValue('tok')
      const res = GET(makeRequest(validParams(), 'http://0.0.0.0:3000'))
      expect(res.headers.get('location')).toBe(
        '/preview/products/shoe?__pt=tok'
      )
    })
  })

  // ─── 3c: Cookie attributes for cross-site CMS preview ─────────────────────
  // These cases verify the SameSite=None;Secure cookie that enables a CMS's
  // cross-site iframe context (HTTPS production path).  The HTTP/__pt path is
  // tested e2e in test/e2e/specs/draft-preview/preview-token.spec.ts and draft-preview/preview-iframe.spec.ts.

  describe('cookie attributes for cross-site CMS preview (3c)', () => {
    it('HTTPS cookie is HttpOnly, Secure, and SameSite=None for cross-site iframe delivery', () => {
      process.env.FRONTEND_URL = 'https://shop.example.com'
      draftModeMocks().createPreviewToken.mockReturnValue('preview-tok-xyz')
      const res = GET(makeRequest(validParams(), 'https://shop.example.com'))
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain('preview-tok-xyz')
      expect(setCookie.toLowerCase()).toContain('httponly')
      expect(setCookie.toLowerCase()).toContain('secure')
      // SameSite=None is required for a CMS's cross-site iframe context
      expect(setCookie.toLowerCase()).toContain('samesite=none')
    })

    it('HTTPS cookie must be Secure when SameSite=None (browsers reject SameSite=None without Secure)', () => {
      process.env.FRONTEND_URL = 'https://shop.example.com'
      draftModeMocks().createPreviewToken.mockReturnValue('preview-tok-xyz')
      const res = GET(makeRequest(validParams(), 'https://shop.example.com'))
      const setCookie = res.headers.get('set-cookie') ?? ''
      // Both attributes must be present together
      expect(setCookie.toLowerCase()).toContain('samesite=none')
      expect(setCookie.toLowerCase()).toContain('secure')
    })

    it('HTTP path puts token in both __pt URL param and SameSite=Lax session cookie', () => {
      delete process.env.FRONTEND_URL
      draftModeMocks().createPreviewToken.mockReturnValue('preview-tok-xyz')
      const res = GET(makeRequest(validParams(), 'http://localhost:3000'))
      // Token in URL param (primary entry credential)
      expect(locationUrl(res).searchParams.get('__pt')).toBe('preview-tok-xyz')
      // Also sets a Lax cookie so the proxy can maintain the draft session across in-app nav
      const cookie = res.headers.get('set-cookie') ?? ''
      expect(cookie).toContain('preview-tok-xyz')
      expect(cookie.toLowerCase()).toContain('samesite=lax')
      expect(cookie.toLowerCase()).toContain('httponly')
    })

    it('HTTP path __pt param is present on the redirect even for non-default locale', () => {
      delete process.env.FRONTEND_URL
      draftModeMocks().createPreviewToken.mockReturnValue('tok-de')
      const res = GET(
        makeRequest(
          { ...validParams(), slug: 'ueber-uns', locale: 'de-DE' },
          'http://localhost:3000'
        )
      )
      const location = res.headers.get('location') ?? ''
      expect(locationUrl(res).searchParams.get('__pt')).toBe('tok-de')
      expect(location).toContain('/de/preview/')
    })
  })
})
