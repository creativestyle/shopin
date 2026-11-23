/**
 * @jest-environment node
 */
/**
 * GET /api/draft/exit tears down a draft preview session: it clears the preview_token
 * cookie and redirects to a clean path. The proxy fully verifies the token (HMAC + exp)
 * before routing, so a forged/stale cookie no longer funnels clean URLs into /preview; but a
 * leftover cookie can still surface on a direct /preview/… visit, where the preview page
 * detects the missing/invalid token and redirects here to clear it (a Server Component cannot
 * clear an HttpOnly cookie, only a route handler can). The real isSafeDraftRedirectPath and
 * relativeRedirect guard the redirect target against open-redirect / path traversal.
 */
import { NextRequest } from 'next/server'

import { GET } from '../route'

const ORIGIN = 'https://shop.example.com'

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('/api/draft/exit', ORIGIN)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function locationUrl(res: Response): URL {
  const url = new URL(res.headers.get('location') ?? '', ORIGIN)
  expect(url.origin).toBe(ORIGIN)
  return url
}

function clearedCookie(res: Response, name: string): string {
  const cookie = res.headers
    .getSetCookie()
    .find((c) => c.startsWith(`${name}=`))
  expect(cookie).toBeDefined()
  return (cookie ?? '').toLowerCase()
}

function locationPath(res: Response): string {
  return locationUrl(res).pathname
}

function locationParams(res: Response): URLSearchParams {
  return locationUrl(res).searchParams
}

describe('GET /api/draft/exit', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl
    }
  })

  it.each(['preview_token', 'preview_active'])(
    'clears the %s cookie (empty value, Max-Age=0, Path=/)',
    (name) => {
      const res = GET(makeRequest({ locale: 'de', slug: 'about' }))
      const cookie = clearedCookie(res, name)
      expect(cookie).toContain(`${name}=;`)
      expect(cookie).toContain('max-age=0')
      expect(cookie).toContain('path=/')
    }
  )

  it('clears both cookies with Secure; SameSite=None when FRONTEND_URL is https', () => {
    process.env.FRONTEND_URL = 'https://shop.example.com'
    const res = GET(makeRequest({ locale: 'de', slug: 'about' }))
    for (const name of ['preview_token', 'preview_active']) {
      const cookie = clearedCookie(res, name)
      expect(cookie).toContain('secure')
      expect(cookie).toContain('samesite=none')
    }
  })

  it('clears both cookies with SameSite=Lax and no Secure when FRONTEND_URL is http', () => {
    process.env.FRONTEND_URL = 'http://localhost:3000'
    const res = GET(makeRequest({ locale: 'de', slug: 'about' }))
    for (const name of ['preview_token', 'preview_active']) {
      const cookie = clearedCookie(res, name)
      expect(cookie).toContain('samesite=lax')
      expect(cookie).not.toContain('secure')
    }
  })

  it('307-redirects to /<locale>/<slug> for a non-default locale', () => {
    const res = GET(makeRequest({ locale: 'de', slug: 'about' }))
    expect(res.status).toBe(307)
    expect(locationPath(res)).toBe('/de/about')
  })

  it('omits the default locale prefix (en → /<slug>)', () => {
    const res = GET(makeRequest({ locale: 'en', slug: 'about' }))
    expect(locationPath(res)).toBe('/about')
  })

  it('redirects to the locale root when the slug is empty (non-default locale)', () => {
    const res = GET(makeRequest({ locale: 'de', slug: '' }))
    expect(locationPath(res)).toBe('/de')
  })

  it('redirects to / for the default locale homepage (empty slug)', () => {
    const res = GET(makeRequest({ locale: 'en', slug: '' }))
    expect(locationPath(res)).toBe('/')
  })

  it('strips leading/trailing slashes from the slug', () => {
    const res = GET(makeRequest({ locale: 'de', slug: '/about/' }))
    expect(locationPath(res)).toBe('/de/about')
  })

  it('falls back to / when the target is unsafe (open-redirect guard)', () => {
    const res = GET(makeRequest({ locale: 'de', slug: '../../evil' }))
    expect(locationPath(res)).toBe('/')
    // The cookie is still cleared regardless of redirect target.
    expect(clearedCookie(res, 'preview_token')).toContain('max-age=0')
  })

  it.each([
    ['\\evil.com', ''],
    ['/\\evil.com', ''],
    ['\tevil.com', ''],
    ['xx', 'about'],
  ])(
    'falls back to / for a locale that is not a configured prefix (%j)',
    (locale, slug) => {
      const res = GET(makeRequest({ locale, slug }))
      expect(locationPath(res)).toBe('/')
    }
  )

  it('keeps a backslash slug on the request origin', () => {
    const res = GET(makeRequest({ locale: 'de', slug: '\\evil.com' }))
    expect(locationPath(res)).toBe('/de/%5Cevil.com')
  })

  it.each([
    ['de', 'über-uns', '/de/%C3%BCber-uns'],
    ['en', '日本/ページ', '/%E6%97%A5%E6%9C%AC/%E3%83%9A%E3%83%BC%E3%82%B8'],
  ])('percent-encodes a non-ASCII slug (%s/%s)', (locale, slug, expected) => {
    const res = GET(makeRequest({ locale, slug }))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(expected)
  })

  it('falls back to / when locale is missing', () => {
    const res = GET(makeRequest({ slug: 'about' }))
    expect(locationPath(res)).toBe('/')
  })

  // ─── Content query state is preserved on the returned URL ──────────────

  it('preserves collection content params (page/sort/filter) on the returned URL', () => {
    const res = GET(
      makeRequest({
        locale: 'de',
        slug: 'c/shoes',
        page: '2',
        sort: 'price-asc',
        filter: 'color:black',
      })
    )
    expect(locationPath(res)).toBe('/de/c/shoes')
    const params = locationParams(res)
    expect(params.get('page')).toBe('2')
    expect(params.get('sort')).toBe('price-asc')
    expect(params.get('filter')).toBe('color:black')
  })

  it('preserves a product variantId on the returned URL', () => {
    const res = GET(
      makeRequest({ locale: 'en', slug: 'p/sneaker', variantId: '42' })
    )
    expect(locationPath(res)).toBe('/p/sneaker')
    expect(locationParams(res).get('variantId')).toBe('42')
  })

  it('strips the control params (locale, slug) from the preserved query string', () => {
    const res = GET(makeRequest({ locale: 'de', slug: 'about', page: '3' }))
    const params = locationParams(res)
    expect(params.has('locale')).toBe(false)
    expect(params.has('slug')).toBe(false)
    expect(params.get('page')).toBe('3')
  })

  it('never echoes the preview token param back onto the published URL', () => {
    const res = GET(
      makeRequest({
        locale: 'de',
        slug: 'about',
        __pt: 'stale-token',
        page: '1',
      })
    )
    const params = locationParams(res)
    expect(params.has('__pt')).toBe(false)
    expect(params.get('page')).toBe('1')
  })
})
