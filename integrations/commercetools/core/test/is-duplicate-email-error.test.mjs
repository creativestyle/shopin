import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import duplicate from '../dist/is-duplicate-email-error.js'

const { isDuplicateEmailError } = duplicate

describe('isDuplicateEmailError', () => {
  it('matches DuplicateField on email', () => {
    assert.equal(
      isDuplicateEmailError({
        statusCode: 400,
        body: { errors: [{ code: 'DuplicateField', field: 'email' }] },
      }),
      true
    )
  })

  for (const [name, error] of [
    [
      'DuplicateField on another field',
      {
        statusCode: 400,
        body: { errors: [{ code: 'DuplicateField', field: 'key' }] },
      },
    ],
    [
      'ConcurrentModification',
      {
        statusCode: 409,
        body: { errors: [{ code: 'ConcurrentModification' }] },
      },
    ],
    ['a bare 409', { statusCode: 409 }],
    ['a body without errors', { statusCode: 400, body: {} }],
    ['null', null],
    ['undefined', undefined],
    ['a string', 'DuplicateField'],
  ]) {
    it(`does not match ${name}`, () => {
      assert.equal(isDuplicateEmailError(error), false)
    })
  }
})
