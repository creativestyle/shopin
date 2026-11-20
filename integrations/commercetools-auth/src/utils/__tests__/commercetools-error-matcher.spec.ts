import { CommercetoolsErrorMatcher } from '../commercetools-error-matcher'

describe('CommercetoolsErrorMatcher.isInvalidTokenError', () => {
  const matcher = new CommercetoolsErrorMatcher()

  it('matches 404 ResourceNotFound', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 404,
        body: { errors: [{ code: 'ResourceNotFound' }] },
      })
    ).toBe(true)
  })

  it('ignores 404 with another code or no body', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 404,
        body: { errors: [{ code: 'Other' }] },
      })
    ).toBe(false)
    expect(matcher.isInvalidTokenError({ statusCode: 404 })).toBe(false)
  })

  it('matches 400 InvalidToken', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 400,
        body: { errors: [{ code: 'InvalidToken' }] },
      })
    ).toBe(true)
  })

  it('ignores 400 ExpiredCustomerPasswordToken', () => {
    expect(
      matcher.isInvalidTokenError({
        statusCode: 400,
        body: { errors: [{ code: 'ExpiredCustomerPasswordToken' }] },
      })
    ).toBe(false)
  })
})
