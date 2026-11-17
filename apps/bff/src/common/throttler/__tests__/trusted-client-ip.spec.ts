import { resolveTrustedClientIp } from '../trusted-client-ip'

const SECRET = 'internal-secret'

describe('resolveTrustedClientIp', () => {
  it('returns the forwarded IP when the secret matches', () => {
    expect(
      resolveTrustedClientIp(
        { 'x-bff-internal-secret': SECRET, 'x-bff-client-ip': '203.0.113.7' },
        SECRET
      )
    ).toBe('203.0.113.7')
  })

  it('ignores the forwarded IP when the secret does not match', () => {
    expect(
      resolveTrustedClientIp(
        { 'x-bff-internal-secret': 'wrong', 'x-bff-client-ip': '203.0.113.7' },
        SECRET
      )
    ).toBeUndefined()
  })

  it('ignores the forwarded IP when no secret is configured', () => {
    expect(
      resolveTrustedClientIp(
        { 'x-bff-internal-secret': '', 'x-bff-client-ip': '203.0.113.7' },
        undefined
      )
    ).toBeUndefined()
  })

  it('ignores a forwarded value that is not an IP', () => {
    expect(
      resolveTrustedClientIp(
        { 'x-bff-internal-secret': SECRET, 'x-bff-client-ip': 'not-an-ip' },
        SECRET
      )
    ).toBeUndefined()
  })
})
