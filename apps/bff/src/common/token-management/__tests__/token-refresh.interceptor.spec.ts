import { UnauthorizedException } from '@nestjs/common'
import { InvalidCurrentPasswordException } from '@integrations/commercetools-api'
import { TokenRefreshInterceptor } from '../token-refresh.interceptor'

/** Exposes the protected guard that decides whether a session refresh is attempted. */
class TestableTokenRefreshInterceptor extends TokenRefreshInterceptor {
  public isSessionFailure(error: unknown): boolean {
    return this.isUnauthorizedError(error)
  }
}

function createInterceptor(): TestableTokenRefreshInterceptor {
  return new TestableTokenRefreshInterceptor(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never
  )
}

describe('TokenRefreshInterceptor.isUnauthorizedError', () => {
  it('treats UnauthorizedException as an expired session', () => {
    expect(
      createInterceptor().isSessionFailure(new UnauthorizedException())
    ).toBe(true)
  })

  it('treats a raw 401 from the data source as an expired session', () => {
    expect(createInterceptor().isSessionFailure({ statusCode: 401 })).toBe(true)
  })

  // A wrong current password must not trigger the refresh-and-replay path: that would
  // resend the same wrong password and then clear the customer's tokens, logging them
  // out over a typo.
  it('does not treat a wrong current password as an expired session', () => {
    expect(
      createInterceptor().isSessionFailure(
        new InvalidCurrentPasswordException()
      )
    ).toBe(false)
  })
})
