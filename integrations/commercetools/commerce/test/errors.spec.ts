/**
 * commercetools' API errors as the shopper gets them: the commerce port translates them itself (criterion: each
 * integration turns its platform's errors into 404, 409, a request-caused 4xx, 502-504), never the platform's text.
 */
import { commercetoolsErrorMeaning } from '@integrations/commercetools-core'
import { commercePort } from '../src/parts/commerce'

const sdkError = (statusCode: number, message = 'platform detail') =>
  Object.assign(new Error(message), {
    statusCode,
    body: { statusCode, message },
  })

describe('commercetools errors', () => {
  it.each([
    [
      400,
      { status: 400 },
      'a page beyond the searchable range: the request caused it',
    ],
    [401, { status: 401 }, 'an expired shopper token: renewed by the BFF'],
    [404, { status: 404 }, 'not found'],
    [409, { status: 409 }, 'changed meanwhile'],
    [500, { status: 502 }, 'the platform failed'],
    [502, { status: 502 }, 'the platform failed'],
    [503, { status: 503 }, 'unavailable'],
    [504, { status: 504 }, 'timed out'],
  ])('%i → %o (%s)', (status, meaning) => {
    expect(commercetoolsErrorMeaning(sdkError(status))).toEqual(meaning)
  })

  it('403 for a token of the wrong grant stays 403; any other 403 (a missing scope) is the setup: 502', () => {
    expect(
      commercetoolsErrorMeaning(
        sdkError(
          403,
          'This endpoint requires an access token issued with the Resource Owner Password Credentials Grant'
        )
      )
    ).toEqual({ status: 403 })
    expect(
      commercetoolsErrorMeaning(sdkError(403, 'insufficient_scope'))
    ).toEqual({
      status: 502,
      message: 'The platform refused the request',
    })
  })

  it('a network failure or a bug is left to the BFF', () => {
    expect(
      commercetoolsErrorMeaning(new TypeError('fetch failed'))
    ).toBeUndefined()
    expect(commercetoolsErrorMeaning(undefined)).toBeUndefined()
  })

  it('the commerce port declares it', () => {
    expect(commercePort().errors).toBe(commercetoolsErrorMeaning)
  })
})
