/**
 * @jest-environment node
 */
/**
 * GET /api/draft/exit tears down a draft preview session: it clears the preview_token
 * cookie and redirects to a clean path. The proxy fully verifies the token (HMAC + exp)
 * before routing, so a forged/stale cookie no longer funnels clean URLs into /preview; but a
 * leftover cookie can still surface on a direct /preview/… visit, where the preview page
 * detects the missing/invalid token and redirects here to clear it (a Server Component cannot
 * clear an HttpOnly cookie, only a route handler can). isSafeDraftRedirectPath guards the
 * redirect target against open-redirect / path traversal.
 */
import { NextRequest } from 'next/server'

jest.mock('@/lib/draft-mode', () => ({
  isSafeDraftRedirectPath: jest.fn(),
  PREVIEW_TOKEN_COOKIE: 'preview_token',
  PREVIEW_TOKEN_INTERNAL_PARAM: '__pt',
}))

import { GET } from '../route'

function safePathMock() {
  return (
    jest.requireMock('@/lib/draft-mode') as {
      isSafeDraftRedirectPath: jest.Mock
    }
  ).isSafeDraftRedirectPath
}

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('/api/draft/exit', 'https://shop.example.com')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

function locationPath(res: Response): string {
  return new URL(res.headers.get('location') ?? '').pathname
}

function locationParams(res: Response): URLSearchParams {
  return new URL(res.headers.get('location') ?? '').searchParams
}

describe('GET /api/draft/exit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    safePathMock().mockReturnValue(true)
  })

  it('clears the preview_token cookie (empty value, Max-Age=0, Path=/)', () => {
    const res = GET(makeRequest({ locale: 'de', slug: 'about' }))
    const cookie = (res.headers.get('set-cookie') ?? '').toLowerCase()
    expect(cookie).toContain('preview_token=;')
    expect(cookie).toContain('max-age=0')
    expect(cookie).toContain('path=/')
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
    safePathMock().mockReturnValue(false)
    const res = GET(makeRequest({ locale: 'de', slug: '../../evil' }))
    expect(locationPath(res)).toBe('/')
    // The cookie is still cleared regardless of redirect target.
    expect((res.headers.get('set-cookie') ?? '').toLowerCase()).toContain(
      'max-age=0'
    )
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
