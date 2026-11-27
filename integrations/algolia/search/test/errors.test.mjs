/**
 * Algolia's errors as the shopper gets them: a query Algolia refuses is the request's (400); key or index problems
 * are the shop's setup (502); rate limit and no reachable host 503; anything else is the BFF's.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { algoliaErrorMeaning } from '../dist/errors.js'

const apiError = (status) =>
  Object.assign(new Error('detail'), { name: 'ApiError', status })

test('Algolia statuses map to what the shopper gets', () => {
  const refused = {
    status: 502,
    message: 'The search platform refused the request',
  }
  for (const [status, meaning] of [
    [400, { status: 400 }],
    [401, refused],
    [403, refused],
    [404, refused],
    [429, { status: 503 }],
    [500, { status: 502 }],
    [503, { status: 503 }],
    [504, { status: 504 }],
  ])
    assert.deepEqual(
      algoliaErrorMeaning(apiError(status)),
      meaning,
      String(status)
    )
})

test('no reachable host (RetryError) is 503; a bug is left to the BFF', () => {
  assert.deepEqual(
    algoliaErrorMeaning(
      Object.assign(new Error('Unreachable hosts'), { name: 'RetryError' })
    ),
    { status: 503 }
  )
  assert.equal(algoliaErrorMeaning(new TypeError('x is undefined')), undefined)
})
