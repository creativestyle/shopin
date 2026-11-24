import {
  getReturnTo,
  getReturnToServer,
  setReturnTo,
  setReturnToFromSearchParams,
} from '../return-to'

describe('getReturnTo', () => {
  it('returns a same-site path', () => {
    expect(
      getReturnTo(new URLSearchParams('returnTo=%2Fcheckout%3Fstep%3D2'))
    ).toBe('/checkout?step=2')
  })

  it.each([
    ['missing', ''],
    ['empty', 'returnTo='],
    ['relative path', 'returnTo=checkout'],
    ['absolute url', 'returnTo=https%3A%2F%2Fevil.com'],
    ['protocol-relative', 'returnTo=%2F%2Fevil.com'],
    ['backslash trick', 'returnTo=%2F%5Cevil.com'],
    ['javascript scheme', 'returnTo=javascript%3Aalert(1)'],
  ])('returns null for a %s value', (_, query) => {
    expect(getReturnTo(new URLSearchParams(query))).toBeNull()
  })

  it('returns null without search params', () => {
    expect(getReturnTo(null)).toBeNull()
    expect(getReturnTo(undefined)).toBeNull()
  })
})

describe('getReturnToServer', () => {
  it('returns a same-site path', () => {
    expect(getReturnToServer({ returnTo: '/account/orders' })).toBe(
      '/account/orders'
    )
  })

  it('ignores array values', () => {
    expect(getReturnToServer({ returnTo: ['/a', '/b'] })).toBeNull()
  })

  it('rejects unsafe values', () => {
    expect(getReturnToServer({ returnTo: '//evil.com' })).toBeNull()
    expect(getReturnToServer({ returnTo: 'https://evil.com' })).toBeNull()
  })

  it('returns null without search params', () => {
    expect(getReturnToServer(null)).toBeNull()
    expect(getReturnToServer({})).toBeNull()
  })
})

describe('setReturnTo', () => {
  it('sets a safe path', () => {
    const params = new URLSearchParams('token=abc')
    setReturnTo(params, '/checkout')
    expect(params.get('returnTo')).toBe('/checkout')
    expect(params.get('token')).toBe('abc')
  })

  it.each([null, '', '//evil.com', 'https://evil.com'])(
    'leaves params untouched for %p',
    (value) => {
      const params = new URLSearchParams()
      setReturnTo(params, value)
      expect(params.has('returnTo')).toBe(false)
    }
  )
})

describe('setReturnToFromSearchParams', () => {
  it('copies returnTo from client search params', () => {
    const params = new URLSearchParams()
    setReturnToFromSearchParams(
      params,
      new URLSearchParams('returnTo=%2Fcheckout&other=1')
    )
    expect(params.toString()).toBe('returnTo=%2Fcheckout')
  })

  it('copies returnTo from server search params', () => {
    const params = new URLSearchParams()
    setReturnToFromSearchParams(params, { returnTo: '/checkout' })
    expect(params.get('returnTo')).toBe('/checkout')
  })

  it('drops an unsafe returnTo', () => {
    const params = new URLSearchParams()
    setReturnToFromSearchParams(params, { returnTo: '//evil.com' })
    expect(params.has('returnTo')).toBe(false)
  })

  it('does nothing without search params', () => {
    const params = new URLSearchParams()
    setReturnToFromSearchParams(params, null)
    setReturnToFromSearchParams(params, undefined)
    expect(params.toString()).toBe('')
  })
})
