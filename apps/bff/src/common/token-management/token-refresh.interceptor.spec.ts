import { UnauthorizedException } from '@nestjs/common'
import { TokenRefreshInterceptor } from './token-refresh.interceptor'

jest.mock('../../data-source/providers', () => ({
  keyOf: (id: string) => id,
  currentProviders: () => ({
    providers: { commerce: 'shop', auth: 'idp' },
    unavailable: {},
  }),
}))

describe('TokenRefreshInterceptor: no refresh across providers', () => {
  it('a commerce part without a guest session answers 401; the auth part is never asked', async () => {
    const authRefresh = jest.fn()
    const ports = {
      commerce: { services: {} },
      auth: {
        identity: {},
        accountFlows: { refreshTokenService: { refreshToken: authRefresh } },
      },
    }
    const vault = {
      refreshOnce: jest.fn(
        async (_c: string, _p: string, refresh: (rt: string) => unknown) =>
          refresh('rt')
      ),
    }
    const interceptor = new TokenRefreshInterceptor(
      ports as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      vault as never
    )
    await expect(
      interceptor['refreshCommerceSession']()
    ).rejects.toBeInstanceOf(UnauthorizedException)
    expect(authRefresh).not.toHaveBeenCalled()
    expect(vault.refreshOnce).not.toHaveBeenCalled()
  })

  it("the commerce part's own guest session refreshes its own entry", async () => {
    const refresh = jest.fn(async () => ({
      accessToken: 'a2',
      refreshToken: 'r2',
      expiresIn: 60,
    }))
    const vault = {
      refreshOnce: jest.fn(
        async (_c: string, _p: string, fn: (rt: string) => unknown) => fn('rt')
      ),
    }
    const ports = { commerce: { services: {}, guestSession: { refresh } } }
    const interceptor = new TokenRefreshInterceptor(
      ports as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      vault as never
    )
    expect(await interceptor['refreshCommerceSession']()).toEqual({
      accessToken: 'a2',
      refreshToken: 'r2',
      expiresIn: 60,
    })
    expect(vault.refreshOnce).toHaveBeenCalledWith(
      'commerce',
      'shop',
      expect.any(Function)
    )
    expect(refresh).toHaveBeenCalledWith('rt')
  })
})
