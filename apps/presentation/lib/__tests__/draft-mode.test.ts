/**
 * @jest-environment node
 */
import { isSiteHttps } from '../draft-mode'

describe('isSiteHttps', () => {
  const original = process.env.FRONTEND_URL

  afterEach(() => {
    if (original === undefined) {
      delete process.env.FRONTEND_URL
    } else {
      process.env.FRONTEND_URL = original
    }
  })

  it.each([
    ['https://shop.example.com', true],
    ['http://localhost:3000', false],
    ['not a url', false],
  ])('FRONTEND_URL=%j → %s', (value, expected) => {
    process.env.FRONTEND_URL = value
    expect(isSiteHttps()).toBe(expected)
  })

  it('is false when FRONTEND_URL is unset', () => {
    delete process.env.FRONTEND_URL
    expect(isSiteHttps()).toBe(false)
  })
})
