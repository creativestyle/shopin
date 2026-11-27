/**
 * Contentful's errors as the shopper gets them: its 4xx are the shop's setup (token, space, content model), never the
 * shopper's request, so 502 with a fixed message; overload and outages 503/504; anything else is the BFF's.
 */
import { contentfulErrorMeaning } from '../src/errors'

const clientError = (status: number) =>
  Object.assign(new Error('GraphQL Error (Code: x): detail'), {
    response: { status },
  })

describe('Contentful errors', () => {
  it.each([
    [400, { status: 502, message: 'The content platform refused the request' }],
    [401, { status: 502, message: 'The content platform refused the request' }],
    [404, { status: 502, message: 'The content platform refused the request' }],
    [429, { status: 503 }],
    [500, { status: 502 }],
    [503, { status: 503 }],
    [504, { status: 504 }],
  ])('%i → %o', (status, meaning) => {
    expect(contentfulErrorMeaning(clientError(status))).toEqual(meaning)
  })

  it('a network failure or a bug is left to the BFF', () => {
    expect(
      contentfulErrorMeaning(new TypeError('fetch failed'))
    ).toBeUndefined()
  })
})
