import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { INVALID_CURRENT_PASSWORD_CODE } from '@core/contracts/customer/customer'
import { firstValueFrom, throwError } from 'rxjs'
import { TokenRefreshInterceptor } from '../token-refresh.interceptor'

function setup() {
  const refreshTokenService = {
    refreshToken: jest.fn().mockResolvedValue({
      accessToken: 'new-access',
      expiresIn: 3600,
    }),
  }
  const tokenStorageService = {
    getAccessToken: jest.fn().mockResolvedValue('access'),
    getRefreshToken: jest.fn().mockResolvedValue('refresh'),
    getAuthStatus: jest.fn().mockResolvedValue(true),
    setAccessToken: jest.fn(),
    setRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
  }
  const cartIdService = { deleteAllCartIds: jest.fn() }
  const interceptor = new TokenRefreshInterceptor(
    { getAuthServices: () => ({ refreshTokenService }) } as never,
    tokenStorageService as never,
    cartIdService as never,
    {} as never,
    { log: jest.fn() } as never
  )
  const request = { headers: {} }
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext

  return { interceptor, context, refreshTokenService, tokenStorageService }
}

function failingHandler(error: unknown) {
  return { handle: jest.fn(() => throwError(() => error)) } as CallHandler & {
    handle: jest.Mock
  }
}

describe('TokenRefreshInterceptor.intercept', () => {
  it('refreshes and replays the request on an expired session', async () => {
    const { interceptor, context, refreshTokenService } = setup()
    const next = failingHandler(new UnauthorizedException())

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).rejects.toBeDefined()

    expect(refreshTokenService.refreshToken).toHaveBeenCalledTimes(1)
    expect(next.handle).toHaveBeenCalledTimes(2)
  })

  it('passes a wrong current password through without refresh, replay or logout', async () => {
    const { interceptor, context, refreshTokenService, tokenStorageService } =
      setup()
    // what any integration throws for a wrong current password: a 400 with the contract's code
    const error = new HttpException(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        code: INVALID_CURRENT_PASSWORD_CODE,
      },
      HttpStatus.BAD_REQUEST
    )
    const next = failingHandler(error)

    await expect(
      firstValueFrom(await interceptor.intercept(context, next))
    ).rejects.toBe(error)

    expect(refreshTokenService.refreshToken).not.toHaveBeenCalled()
    expect(tokenStorageService.clearTokens).not.toHaveBeenCalled()
    expect(next.handle).toHaveBeenCalledTimes(1)
  })
})
