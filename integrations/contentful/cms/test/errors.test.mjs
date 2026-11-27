/**
 * Contentful's errors as the shopper gets them: its 4xx are the shop's setup (token, space, content model), never the
 * shopper's request, so 502 with a fixed message; overload and outages 503/504; anything else is the BFF's.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { format } from 'node:util'
import errors from '../dist/errors.js'

const { contentfulErrorMeaning } = errors

const clientError = (status) =>
  Object.assign(new Error('GraphQL Error (Code: x): detail'), {
    response: { status },
  })

describe('Contentful errors', () => {
  for (const [status, meaning] of [
    [400, { status: 502, message: 'The content platform refused the request' }],
    [401, { status: 502, message: 'The content platform refused the request' }],
    [404, { status: 502, message: 'The content platform refused the request' }],
    [429, { status: 503 }],
    [500, { status: 502 }],
    [503, { status: 503 }],
    [504, { status: 504 }],
  ]) {
    // the name as Jest's it.each('%i → %o') printed it
    it(format('%i → %o', status, meaning), () => {
      assert.deepEqual(contentfulErrorMeaning(clientError(status)), meaning)
    })
  }

  it('a network failure or a bug is left to the BFF', () => {
    assert.equal(
      contentfulErrorMeaning(new TypeError('fetch failed')),
      undefined
    )
  })
})
