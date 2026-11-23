/**
 * @jest-environment node
 */
import {
  encodePathSegments,
  isSafeRelativeLocation,
  relativeRedirect,
} from '../relative-redirect'

const ORIGIN = 'https://shop.example.com'

function resolvedOrigin(res: Response): string {
  return new URL(res.headers.get('location') ?? '', ORIGIN).origin
}

describe('relativeRedirect', () => {
  it('keeps a safe path-only location', () => {
    const res = relativeRedirect('/de/about?page=2')
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('/de/about?page=2')
  })

  it.each([
    '//evil.com',
    '/\\evil.com',
    '/de/\\evil.com',
    '/\t/evil.com',
    '/x\ny',
    'https://evil.com',
    'evil.com',
    '',
    '/über',
  ])('falls back to / for %j and stays on the request origin', (location) => {
    const res = relativeRedirect(location)
    expect(res.headers.get('location')).toBe('/')
    expect(resolvedOrigin(res)).toBe(ORIGIN)
  })
})

describe('isSafeRelativeLocation', () => {
  it('accepts percent-encoded paths with a query', () => {
    expect(isSafeRelativeLocation('/de/%C3%BCber-uns?x=a+b')).toBe(true)
  })
})

describe('encodePathSegments', () => {
  it('percent-encodes non-ASCII segments as UTF-8', () => {
    expect(encodePathSegments('über-uns/日本')).toBe(
      '%C3%BCber-uns/%E6%97%A5%E6%9C%AC'
    )
  })

  it('does not double-encode an already-encoded segment', () => {
    expect(encodePathSegments('%C3%BCber-uns')).toBe('%C3%BCber-uns')
  })

  it('encodes a backslash instead of passing it through', () => {
    expect(encodePathSegments('\\evil.com')).toBe('%5Cevil.com')
  })

  it('keeps slashes between segments', () => {
    expect(encodePathSegments('c/shoes')).toBe('c/shoes')
  })
})
