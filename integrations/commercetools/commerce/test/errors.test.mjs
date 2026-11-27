/**
 * commercetools' API errors as the shopper gets them: the commerce port translates them itself (criterion: each
 * integration turns its platform's errors into 404, 409, a request-caused 4xx, 502-504), never the platform's text.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { format } from 'node:util'
import core from '@integrations/commercetools-core'
import commerce from '../dist/parts/commerce.js'

const { commercetoolsErrorMeaning } = core
const { commercePort } = commerce

const sdkError = (statusCode, message = 'platform detail') =>
  Object.assign(new Error(message), {
    statusCode,
    body: { statusCode, message },
  })

describe('commercetools errors', () => {
  for (const [status, meaning, why] of [
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
  ]) {
    it(format('%i → %o (%s)', status, meaning, why), () => {
      assert.deepEqual(commercetoolsErrorMeaning(sdkError(status)), meaning)
    })
  }

  it('403 for a token of the wrong grant stays 403; any other 403 (a missing scope) is the setup: 502', () => {
    assert.deepEqual(
      commercetoolsErrorMeaning(
        sdkError(
          403,
          'This endpoint requires an access token issued with the Resource Owner Password Credentials Grant'
        )
      ),
      { status: 403 }
    )
    assert.deepEqual(
      commercetoolsErrorMeaning(sdkError(403, 'insufficient_scope')),
      {
        status: 502,
        message: 'The platform refused the request',
      }
    )
  })

  it('a network failure or a bug is left to the BFF', () => {
    assert.equal(
      commercetoolsErrorMeaning(new TypeError('fetch failed')),
      undefined
    )
    assert.equal(commercetoolsErrorMeaning(undefined), undefined)
  })

  it('the commerce port declares it', () => {
    assert.equal(commercePort().errors, commercetoolsErrorMeaning)
  })
})
