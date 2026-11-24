import { TokenStorageService } from '../token-storage.service'
import type { DataSource } from '@config/constants'

function createService(dataSource: DataSource, cookies: string[] = []) {
  const cookieService = {
    hasCookie: jest.fn((name: string) => cookies.includes(name)),
    clearCookie: jest.fn(),
    setCookie: jest.fn(),
    getCookie: jest.fn(),
    createCookieOptions: jest.fn(() => ({})),
  }
  const encryption = { encryptAndSign: jest.fn(async () => 'sealed') }
  const service = new TokenStorageService(
    cookieService as never,
    encryption as never,
    dataSource
  )
  return { service, cookieService }
}

describe('TokenStorageService cookie names', () => {
  it('keeps mock-set tokens in their own cookies', async () => {
    const { service, cookieService } = createService('mock-set', [
      'access_token',
    ])

    expect(service.hasAccessToken()).toBe(false)

    await service.setTokens(
      { accessToken: 'a', refreshToken: 'r', expiresIn: 60 },
      false
    )
    expect(cookieService.setCookie.mock.calls.map(([name]) => name)).toEqual([
      'access_token-mock',
      'refresh_token-mock',
    ])
  })

  it.each(['commercetools-set', 'commercetools-algolia-set'] as const)(
    'shares the commercetools token cookies on %s',
    (dataSource) => {
      const { service, cookieService } = createService(dataSource, [
        'access_token',
      ])

      expect(service.hasAccessToken()).toBe(true)

      service.clearTokens()
      expect(
        cookieService.clearCookie.mock.calls.map(([name]) => name)
      ).toEqual(['access_token', 'refresh_token'])
    }
  )
})
