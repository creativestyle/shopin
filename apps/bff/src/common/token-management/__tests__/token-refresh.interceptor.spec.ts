import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { INVALID_CURRENT_PASSWORD_CODE } from '@core/contracts/customer/customer'
import { firstValueFrom, of, throwError } from 'rxjs'
import { TokenRefreshInterceptor } from '../token-refresh.interceptor'

jest.mock('../../../data-source/providers', () => ({
  keyOf: (id: string) => id,
  currentProviders: () => ({ providers: { commerce: 'test-commerce' } }),
}))

/** What the commerce integration throws for a wrong current password: a 400 with the contract code. */
function invalidCurrentPasswordException() {
  return new HttpException(
    {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Invalid current password',
      code: INVALID_CURRENT_PASSWORD_CODE,
    },
    HttpStatus.BAD_REQUEST
  )
}

function setup() {
  // The commerce part's session refresh, reached through the vault's single-flight refresh
  const refreshToken = jest.fn().mockResolvedValue({
    accessToken: 'new-access',
    expiresIn: 3600,
  })
  const vault = {
    refreshOnce: jest.fn(
      (
        _category: string,
        _provider: string,
        refresh: (token: string) => Promise<unknown>
      ) => refresh('refresh')
    ),
  }
  const tokenStorageService = {
    getAccessToken: jest.fn().mockResolvedValue('access'),
    getRefreshToken: jest.fn().mockResolvedValue('refresh'),
    getAuthStatus: jest.fn().mockResolvedValue(true),
    clearTokens: jest.fn(),
  }
  const cartIdService = { deleteAllCartIds: jest.fn() }
  const interceptor = new TokenRefreshInterceptor(
    { commerce: { guestSession: { refresh: refreshToken } } } as never,
    tokenStorageService as never,
    cartIdService as never,
    {} as never,
    { log: jest.fn() } as never,
    vault as never
  )
  const request = { headers: {} }
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({ clearCookie: jest.fn() }),
    }),
  } as unknown as ExecutionContext

  return {
    interceptor,
    context,
    refreshToken,
    tokenStorageService,
    cartIdService,
  }
}

function failingHandler(error: unknown) {
  return { handle: jest.fn(() => throwError(() => error)) } as CallHandler & {
    handle: jest.Mock
  }
}

describe('TokenRefreshInterceptor.intercept', () => {
  it('refreshes and replays the request on an expired session', async () => {
    const { interceptor, context, refreshToken } = setup()
    const next = failingHandler(new UnauthorizedException())

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).rejects.toBeDefined()

    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(next.handle).toHaveBeenCalledTimes(2)
  })

  it('passes a wrong current password through without refresh, replay or logout', async () => {
    const { interceptor, context, refreshToken, tokenStorageService } = setup()
    const error = invalidCurrentPasswordException()
    const next = failingHandler(error)

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).rejects.toBe(error)

    expect(refreshToken).not.toHaveBeenCalled()
    expect(tokenStorageService.clearTokens).not.toHaveBeenCalled()
    expect(next.handle).toHaveBeenCalledTimes(1)
  })
})

describe('TokenRefreshInterceptor: a dead refresh token (OAuth invalid_grant)', () => {
  const deadGrant = () =>
    Object.assign(new Error('invalid_grant'), {
      statusCode: 400,
      body: { error: 'invalid_grant' },
    })

  it('ends the session and lets the request go on as a new guest, instead of failing every call', async () => {
    const {
      interceptor,
      context,
      refreshToken,
      tokenStorageService,
      cartIdService,
    } = setup()
    tokenStorageService.getAccessToken.mockResolvedValue(undefined)
    refreshToken.mockRejectedValue(deadGrant())
    const next = { handle: jest.fn(() => of('ok')) } as unknown as CallHandler

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).resolves.toBe('ok')
    expect(tokenStorageService.clearTokens).toHaveBeenCalled()
    expect(cartIdService.deleteAllCartIds).toHaveBeenCalled()
  })

  it('after a 401, a refresh refused as invalid_grant answers 401 and clears the tokens (not a 500)', async () => {
    const { interceptor, context, refreshToken, tokenStorageService } = setup()
    refreshToken.mockRejectedValue(deadGrant())
    const next = failingHandler(new UnauthorizedException())

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).rejects.toBeInstanceOf(UnauthorizedException)
    expect(tokenStorageService.clearTokens).toHaveBeenCalled()
  })

  it('a refresh failing for another reason (network) is not treated as a dead session', async () => {
    const { interceptor, context, refreshToken, tokenStorageService } = setup()
    tokenStorageService.getAccessToken.mockResolvedValue(undefined)
    refreshToken.mockRejectedValue(
      Object.assign(new Error('ECONNRESET'), { code: 'ECONNRESET' })
    )
    const next = { handle: jest.fn(() => of('ok')) } as unknown as CallHandler

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).rejects.toThrow('ECONNRESET')
    expect(tokenStorageService.clearTokens).not.toHaveBeenCalled()
  })
})

describe("a customer's dead refresh token ends the SHOPin session in the same request", () => {
  it('the session is marked signed out and its cookie cleared; the request goes on as a guest', async () => {
    const { interceptor, refreshToken, tokenStorageService } = setup()
    tokenStorageService.getAccessToken.mockResolvedValue(undefined)
    tokenStorageService.getAuthStatus.mockResolvedValue(true) // a customer's token
    refreshToken.mockRejectedValue(
      Object.assign(new Error('invalid_grant'), {
        statusCode: 400,
        body: { error: 'invalid_grant' },
      })
    )
    const clearCookie = jest.fn()
    const request = { headers: {} }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ clearCookie }),
      }),
    } as unknown as ExecutionContext
    const next = { handle: jest.fn(() => of('ok')) } as unknown as CallHandler
    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).resolves.toBe('ok')
    expect(clearCookie).toHaveBeenCalledWith('shopin-session', { path: '/' })
  })
})

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
      'test-commerce',
      expect.any(Function)
    )
    expect(refresh).toHaveBeenCalledWith('rt')
  })
})
