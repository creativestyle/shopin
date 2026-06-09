/**
 * @jest-environment node
 */
/**
 * GET /api/draft is the CMS preview entry route. A CMS editor clicks a
 * "Preview" link in the CMS UI, which hits this route with a short-lived
 * secret + slug + locale. On success the route redirects the editor to the live
 * site's /preview/ path with a signed token as ?__pt=. The preview page validates
 * the token then strips it from the address bar via router.replace().
 *
 * Slug normalisation and isSafeDraftRedirectPath guard against open-redirect attacks.
 */
import { NextRequest } from 'next/server'

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock('@/lib/draft-mode', () => ({
  isDraftSecretValid: jest.fn(),
  isSafeDraftRedirectPath: jest.fn(),
  createPreviewToken: jest.fn(),
  PREVIEW_TOKEN_COOKIE: 'preview_token',
  PREVIEW_TOKEN_INTERNAL_PARAM: '__pt',
}))

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
  origin = 'https://shop.example.com'
): NextRequest {
  const url = new URL('/api/draft', origin)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
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
    delete process.env.FRONTEND_URL
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

    it('does NOT put the token in the redirect URL on HTTPS', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams()))
      expect(res.headers.get('location')).not.toContain('my-signed-token')
    })
  })

  // ─── Success path — HTTP (local dev) ─────────────────────────────────

  describe('success path on HTTP', () => {
    it('puts the token as ?__pt= in the redirect URL', () => {
      draftModeMocks().createPreviewToken.mockReturnValue('my-signed-token')
      const res = GET(makeRequest(validParams(), 'http://localhost:3000'))
      const location = res.headers.get('location') ?? ''
      expect(new URL(location).searchParams.get('__pt')).toBe('my-signed-token')
    })

    it('does NOT set a cookie on HTTP', () => {
      const res = GET(makeRequest(validParams(), 'http://localhost:3000'))
      expect(res.headers.get('set-cookie')).toBeNull()
    })
  })

  // ─── getDraftRedirectBase ────────────────────────────────────────────

  describe('redirect base', () => {
    it('uses FRONTEND_URL when set, stripping trailing slash', () => {
      process.env.FRONTEND_URL = 'https://shop.example.com/'
      const res = GET(makeRequest(validParams()))
      const location = res.headers.get('location') ?? ''
      expect(location.startsWith('https://shop.example.com/')).toBe(true)
      // Confirm no double slash after base
      expect(location).not.toContain('com//')
    })

    it('uses request origin when FRONTEND_URL is not set', () => {
      const res = GET(makeRequest(validParams(), 'https://localhost:3000'))
      const location = res.headers.get('location') ?? ''
      expect(location.startsWith('https://localhost:3000')).toBe(true)
    })

    it('rewrites 0.0.0.0 to localhost when FRONTEND_URL is unset', () => {
      const res = GET(makeRequest(validParams(), 'http://0.0.0.0:3000'))
      const location = res.headers.get('location') ?? ''
      expect(location.startsWith('http://localhost:3000')).toBe(true)
    })
  })
})
