import { isDuplicateEmailError } from '@integrations/commercetools-api'

describe('isDuplicateEmailError', () => {
  it('matches DuplicateField on email', () => {
    expect(
      isDuplicateEmailError({
        statusCode: 400,
        body: { errors: [{ code: 'DuplicateField', field: 'email' }] },
      })
    ).toBe(true)
  })

  it.each([
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
  ])('does not match %s', (_, error) => {
    expect(isDuplicateEmailError(error)).toBe(false)
  })
})
