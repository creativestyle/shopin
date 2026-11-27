/**
 * Each integration turns its platform's errors into what they mean (`errors` on its port); the BFF applies that, and
 * a vendor-neutral network check, to every call and answers with the matching status and a fixed message, never the
 * platform's text. Sign-in flows get only platform failures (502–504) translated: the session check and the token
 * refresh read their 4xx raw.
 */
import {
  BadRequestException,
  GatewayTimeoutException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common'
import type { PortError } from '@core/integration-kit'
import { withPortErrors } from './port-errors'

const platformError = (status: number) =>
  Object.assign(new Error(`platform says ${status}: secret detail`), {
    statusCode: status,
  })
const translate = (e: unknown): PortError | undefined => {
  const status = (e as { statusCode?: number }).statusCode
  if (status === 400) {
    return { status: 400 }
  }
  if (status === 404) {
    return { status: 404 }
  }
  if (status === 503) {
    return { status: 503 }
  }
  return undefined
}

describe('the port errors the BFF answers with', () => {
  class CartService {
    secret = 'x'
    async getCart(id: string) {
      throw platformError(id === 'gone' ? 404 : 400)
    }
    count(): number {
      throw platformError(503)
    }
    async fine() {
      return this.secret
    }
  }
  const port = withPortErrors(
    {
      cartService: new CartService(),
      setCartFields: async () => {
        throw platformError(404)
      },
      guestSession: {
        refresh: async (rt: string) => {
          throw platformError(rt === 'down' ? 503 : 400)
        },
      },
    },
    'commerce',
    translate
  )

  it('a request-caused platform error answers 400 with a fixed message (not 500, not the platform text)', async () => {
    const error = await port.cartService
      .getCart('page-beyond-range')
      .catch((e) => e)
    expect(error).toBeInstanceOf(BadRequestException)
    expect(error.message).toBe('The request cannot be served')
    expect(error.cause.statusCode).toBe(400)
  })

  it('not found is a NotFoundException the BFF already understands; a sync method too', async () => {
    await expect(port.cartService.getCart('gone')).rejects.toBeInstanceOf(
      NotFoundException
    )
    expect(() => port.cartService.count()).toThrow(
      'The platform is unavailable'
    )
    await expect(port.setCartFields()).rejects.toBeInstanceOf(NotFoundException)
  })

  it('methods keep their object (this) and results', async () => {
    await expect(port.cartService.fine()).resolves.toBe('x')
  })

  it('sign-in members keep their raw 4xx (the token refresh reads invalid_grant itself); a platform failure is translated', async () => {
    await expect(port.guestSession.refresh('rt')).rejects.toMatchObject({
      statusCode: 400,
    })
    await expect(port.guestSession.refresh('down')).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })

  it('an error the integration does not translate, and a Nest exception, pass unchanged', async () => {
    const bug = new TypeError('a bug')
    const raw = withPortErrors(
      { xService: { run: () => Promise.reject(bug) } },
      'commerce',
      translate
    )
    await expect(raw.xService.run()).rejects.toBe(bug)
    const own = new NotFoundException('Cart not found: c1')
    const nest = withPortErrors(
      { xService: { run: () => Promise.reject(own) } },
      'commerce',
      () => ({ status: 503 })
    )
    await expect(nest.xService.run()).rejects.toBe(own)
  })

  it('the auth port and its account flows: a 4xx stays raw for the session check, a platform failure is translated', async () => {
    const auth = withPortErrors(
      {
        refresh: async (subject: string) =>
          Promise.reject(platformError(subject === 'down' ? 503 : 404)),
        accountFlows: {
          resetPasswordService: {
            resetPassword: async () => Promise.reject(platformError(503)),
          },
        },
      },
      'auth',
      translate
    )
    await expect(auth.refresh('gone')).rejects.toMatchObject({
      statusCode: 404,
    })
    await expect(auth.refresh('down')).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
    await expect(
      auth.accountFlows.resetPasswordService.resetPassword()
    ).rejects.toBeInstanceOf(ServiceUnavailableException)
  })

  it('reads no member before it is used (a port serving through others has getters bound to the request)', async () => {
    const now: { request?: string } = {}
    const switched = {}
    Object.defineProperty(switched, 'customers', {
      enumerable: true,
      get() {
        if (!now.request) {
          throw new Error('No request in progress')
        }
        return { find: async () => Promise.reject(platformError(503)) }
      },
    })
    const served = withPortErrors(
      switched as { customers: { find: () => Promise<unknown> } },
      'commerce',
      translate
    )
    now.request = 'r1'
    await expect(served.customers.find()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    )
  })

  it('a network failure is translated without the integration: refused is 503, a timeout 504, also as the cause', async () => {
    const refused = new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), {
        code: 'ECONNREFUSED',
      }),
    })
    const timeout = new DOMException('The operation timed out', 'TimeoutError')
    const plain = withPortErrors(
      {
        xService: {
          run: async (e: unknown) => Promise.reject(e),
        },
      },
      'cms',
      undefined
    )
    const asRefused = await plain.xService.run(refused).catch((e) => e)
    expect(asRefused).toBeInstanceOf(ServiceUnavailableException)
    expect(asRefused.message).toBe('The platform is unavailable')
    expect(asRefused.cause).toBe(refused)
    await expect(plain.xService.run(timeout)).rejects.toBeInstanceOf(
      GatewayTimeoutException
    )
  })
})
