import type { ExecutionContext } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { ThrottlerGuard, type ThrottlerStorage } from '@nestjs/throttler'
import { OptionalThrottlerGuard } from '../throttler'
import { SecureRateLimit } from '../secure-rate-limit.decorator'

const SECRET = 'internal-secret'

function createGuard(env: Record<string, string | undefined>) {
  const config = {
    get: jest.fn((key: string) => env[key]),
  } as unknown as ConfigService
  const storage = { increment: jest.fn() } as unknown as ThrottlerStorage

  return new OptionalThrottlerGuard(
    { throttlers: [{ name: 'default', ttl: 60000, limit: 100 }] },
    storage,
    new Reflector(),
    config
  )
}

class TestController {
  getCart() {}

  @SecureRateLimit()
  signIn() {}
}

function createContext(
  headers: Record<string, string>,
  handler: () => void = TestController.prototype.getCart
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers, ip: '10.0.0.1' }),
      getResponse: () => ({ header: jest.fn() }),
    }),
    getHandler: () => handler,
    getClass: () => TestController,
  } as unknown as ExecutionContext
}

describe('OptionalThrottlerGuard', () => {
  let throttle: jest.SpyInstance

  beforeEach(() => {
    throttle = jest
      .spyOn(ThrottlerGuard.prototype, 'canActivate')
      .mockResolvedValue(true)
  })

  afterEach(() => {
    throttle.mockRestore()
  })

  it('skips throttling for a request carrying the configured internal secret', async () => {
    const guard = createGuard({
      BFF_RATE_LIMIT_ENABLED: 'true',
      BFF_INTERNAL_SECRET: SECRET,
    })
    await guard.onModuleInit()

    await expect(
      guard.canActivate(createContext({ 'x-bff-internal-secret': SECRET }))
    ).resolves.toBe(true)
    expect(throttle).not.toHaveBeenCalled()
  })

  it('still throttles a secure route for a request carrying the internal secret', async () => {
    const guard = createGuard({
      BFF_RATE_LIMIT_ENABLED: 'true',
      BFF_INTERNAL_SECRET: SECRET,
    })
    await guard.onModuleInit()

    await guard.canActivate(
      createContext(
        { 'x-bff-internal-secret': SECRET },
        TestController.prototype.signIn
      )
    )

    expect(throttle).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['a wrong secret', { 'x-bff-internal-secret': 'wrong' }, SECRET],
    ['no secret header', {}, SECRET],
    ['no configured secret', { 'x-bff-internal-secret': '' }, ''],
  ])('throttles a request with %s', async (_, headers, configured) => {
    const guard = createGuard({
      BFF_RATE_LIMIT_ENABLED: 'true',
      BFF_INTERNAL_SECRET: configured,
    })
    await guard.onModuleInit()

    await guard.canActivate(createContext(headers))

    expect(throttle).toHaveBeenCalledTimes(1)
  })
})
