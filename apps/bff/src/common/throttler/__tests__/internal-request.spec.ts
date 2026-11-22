import { isTrustedInternalRequest } from '../internal-request'

const SECRET = 'internal-secret'

describe('isTrustedInternalRequest', () => {
  it('trusts a request whose secret matches', () => {
    expect(
      isTrustedInternalRequest({ 'x-bff-internal-secret': SECRET }, SECRET)
    ).toBe(true)
  })

  it('rejects a request with a wrong secret', () => {
    expect(
      isTrustedInternalRequest({ 'x-bff-internal-secret': 'wrong' }, SECRET)
    ).toBe(false)
  })

  it('rejects a request without the secret header', () => {
    expect(isTrustedInternalRequest({}, SECRET)).toBe(false)
  })

  it.each([undefined, '', '   '])(
    'rejects every request when the configured secret is %p',
    (configured) => {
      expect(
        isTrustedInternalRequest({ 'x-bff-internal-secret': '' }, configured)
      ).toBe(false)
      expect(
        isTrustedInternalRequest({ 'x-bff-internal-secret': '   ' }, configured)
      ).toBe(false)
    }
  )
})
