import {
  BffUnreachableError,
  getNetworkErrorCode,
  isBffUnreachableCode,
} from '../bff-unreachable-error'

function fetchFailed(cause?: unknown): TypeError {
  return new TypeError('fetch failed', { cause })
}

describe('getNetworkErrorCode', () => {
  it('reads the code from the error cause', () => {
    expect(getNetworkErrorCode(fetchFailed({ code: 'ECONNREFUSED' }))).toBe(
      'ECONNREFUSED'
    )
  })

  it('falls back to the first inner error of an AggregateError cause', () => {
    const cause = new AggregateError([
      Object.assign(new Error('v6'), { code: 'ECONNREFUSED' }),
      Object.assign(new Error('v4'), { code: 'ETIMEDOUT' }),
    ])
    expect(getNetworkErrorCode(fetchFailed(cause))).toBe('ECONNREFUSED')
  })

  it('returns undefined when there is no cause', () => {
    expect(getNetworkErrorCode(new Error('boom'))).toBeUndefined()
  })

  it('returns undefined for non-Error values and non-string codes', () => {
    expect(getNetworkErrorCode('timeout')).toBeUndefined()
    expect(getNetworkErrorCode(fetchFailed({ code: 111 }))).toBeUndefined()
  })
})

describe('isBffUnreachableCode', () => {
  it.each([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'UND_ERR_CONNECT_TIMEOUT',
  ])('treats connect-phase code %s as unreachable', (code) => {
    expect(isBffUnreachableCode(code)).toBe(true)
  })

  it.each(['ECONNRESET', 'UND_ERR_SOCKET'])(
    'does not treat mid-request failure %s as unreachable',
    (code) => {
      expect(isBffUnreachableCode(code)).toBe(false)
    }
  )

  it('returns false for undefined', () => {
    expect(isBffUnreachableCode(undefined)).toBe(false)
  })
})

describe('BffUnreachableError', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    Object.assign(process.env, { NODE_ENV: originalEnv })
  })

  it('keeps url, code and cause', () => {
    const cause = fetchFailed({ code: 'ECONNREFUSED' })
    const err = new BffUnreachableError('http://bff', 'ECONNREFUSED', {
      cause,
    })
    expect(err).toBeInstanceOf(BffUnreachableError)
    expect(err.name).toBe('BffUnreachableError')
    expect(err.bffUrl).toBe('http://bff')
    expect(err.code).toBe('ECONNREFUSED')
    expect(err.cause).toBe(cause)
    expect(err.message).toContain(
      'BFF unreachable at http://bff (ECONNREFUSED)'
    )
  })

  it('includes the dev hint outside production', () => {
    Object.assign(process.env, { NODE_ENV: 'development' })
    const err = new BffUnreachableError('http://bff', 'ECONNREFUSED')
    expect(err.message).toContain('TypeScript errors')
  })

  it('omits the dev hint in production', () => {
    Object.assign(process.env, { NODE_ENV: 'production' })
    const err = new BffUnreachableError('http://bff', 'ECONNREFUSED')
    expect(err.message).toBe('BFF unreachable at http://bff (ECONNREFUSED).')
  })
})
