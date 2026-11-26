import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  HttpException,
  NotFoundException,
  NotImplementedException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { HttpErrorFilter } from '../http-exception.filter'
import { ZodError } from 'zod'
import { FrontendInputValidationException } from '../../validation/frontend-input-validation.exception'
import { FrontendSafeException } from '../../errors/frontend-safe.exception'

function createHttpHostMock() {
  let statusCodeSet: number | undefined
  let jsonBody: unknown

  const response = {
    status(code: number) {
      statusCodeSet = code
      return this
    },
    json(body: unknown) {
      jsonBody = body
      return this
    },
  }

  const request: Record<string, unknown> & { method: string; url: string } = {
    method: 'GET',
    url: '/test',
  }

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost

  return {
    host,
    getStatus: () => statusCodeSet,
    getJson: () => jsonBody,
    request,
  }
}

describe('HttpErrorFilter', () => {
  it('returns 400 with issues for FrontendInputValidationException (validation)', () => {
    const { host, getStatus, getJson, request } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    const zerr = new ZodError([
      { code: 'custom', path: ['field'], message: 'Required' },
    ])
    const exception = new FrontendInputValidationException(zerr.issues)

    filter.catch(exception, host)

    expect(getStatus()).toBe(400)
    expect(getJson()).toEqual({
      statusCode: 400,
      message: 'Validation failed',
      issues: zerr.issues,
    })
    expect(request.__nestException).toEqual({
      name: 'FrontendInputValidationException',
      message: expect.any(String),
    })
  })

  it('returns 400 with only the reason for FrontendSafeException', () => {
    const { host, getStatus, getJson } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(new FrontendSafeException('expired'), host)

    expect(getStatus()).toBe(400)
    expect(getJson()).toEqual({
      statusCode: 400,
      message: 'Bad request',
      reason: 'expired',
    })
  })

  it('returns 500 for ZodError (validation thrown directly)', () => {
    const { host, getStatus, getJson, request } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    const zerr = new ZodError([])
    filter.catch(zerr, host)

    expect(getStatus()).toBe(500)
    expect(getJson()).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    })
    expect(request.__nestException).toMatchObject({
      name: 'Error',
      message: expect.any(String),
    })
    expect(request.__nestException).toHaveProperty('stack')
  })

  it('returns 401 for UnauthorizedException', () => {
    const { host, getStatus, getJson, request } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(new UnauthorizedException(), host)

    expect(getStatus()).toBe(401)
    expect(getJson()).toEqual({ statusCode: 401, message: 'Unauthorized' })
    expect(request.__nestException).toEqual({
      name: 'UnauthorizedException',
      message: 'Unauthorized',
    })
  })

  it('forwards a machine-readable code from our own exceptions', () => {
    const { host, getStatus, getJson } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(
      new HttpException(
        {
          statusCode: 400,
          message: 'Invalid current password',
          code: 'INVALID_CURRENT_PASSWORD',
        },
        400
      ),
      host
    )

    expect(getStatus()).toBe(400)
    expect(getJson()).toEqual({
      statusCode: 400,
      message: 'Bad Request',
      code: 'INVALID_CURRENT_PASSWORD',
    })
  })

  it('drops codes that are not on the public allow-list', () => {
    const { host, getJson } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(
      new HttpException({ message: 'x', code: 'INTERNAL_DB_ID_42' }, 401),
      host
    )

    expect(getJson()).toEqual({ statusCode: 401, message: 'Unauthorized' })
  })

  it('does not forward non-string codes or exception messages', () => {
    const { host, getJson } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(
      new HttpException({ message: 'internals leak', code: 42 }, 401),
      host
    )

    expect(getJson()).toEqual({ statusCode: 401, message: 'Unauthorized' })
  })

  it('returns 404 for NotFoundException', () => {
    const { host, getStatus, getJson, request } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(new NotFoundException(), host)

    expect(getStatus()).toBe(404)
    expect(getJson()).toEqual({ statusCode: 404, message: 'Not Found' })
    expect(request.__nestException).toEqual({
      name: 'NotFoundException',
      message: 'Not Found',
    })
  })

  it('returns 500 for generic Error', () => {
    const { host, getStatus, getJson, request } = createHttpHostMock()
    const filter = new HttpErrorFilter()

    filter.catch(new Error('boom'), host)

    expect(getStatus()).toBe(500)
    expect(getJson()).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    })
    expect(request.__nestException).toMatchObject({
      name: 'Error',
      message: 'boom',
    })
    expect(request.__nestException).toHaveProperty('stack')
  })

  it.each([
    [
      new NotImplementedException('wishlist is not offered'),
      501,
      'Not implemented',
    ],
    [new BadGatewayException('platform answered 502'), 502, 'Bad gateway'],
    [
      new ServiceUnavailableException('platform down'),
      503,
      'Service unavailable',
    ],
    [new GatewayTimeoutException('platform timed out'), 504, 'Gateway timeout'],
  ])(
    'keeps a server-side status a caller acts on (%#): status and a generic message, the stack logged',
    (exception, status, message) => {
      const { host, getStatus, getJson, request } = createHttpHostMock()
      new HttpErrorFilter().catch(exception, host)
      expect(getStatus()).toBe(status)
      // the exception's own message (a platform's text) is never sent
      expect(getJson()).toEqual({ statusCode: status, message })
      expect(request.__nestException).toHaveProperty('stack')
    }
  )

  it('other statuses without a body of their own stay 500', () => {
    const { host, getStatus, getJson } = createHttpHostMock()
    new HttpErrorFilter().catch(new HttpException('teapot', 418), host)
    expect(getStatus()).toBe(500)
    expect(getJson()).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    })
  })
})

describe('HttpErrorFilter: a vendor SDK or the network failing', () => {
  // the shapes the vendors' SDKs throw (not Nest exceptions): each is the platform failing, down or slow
  const commercetools503 = Object.assign(new Error('Service Unavailable'), {
    name: 'ServiceUnavailable',
    statusCode: 503,
    body: { statusCode: 503, message: 'upstream down' },
  })
  const commercetools502ByName = Object.assign(new Error('Bad Gateway'), {
    name: 'BadGateway',
  })
  const fetchRefused = new TypeError('fetch failed', {
    cause: Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), {
      code: 'ECONNREFUSED',
    }),
  })
  const algoliaApi502 = Object.assign(new Error('Bad gateway'), {
    name: 'ApiError',
    status: 502,
  })
  const algoliaUnreachable = Object.assign(
    new Error('Unreachable hosts - your application id may be incorrect'),
    { name: 'RetryError', stackTrace: [] }
  )
  const contentful503 = Object.assign(
    new Error(
      JSON.stringify({ status: 503, statusText: 'Service Unavailable' })
    ),
    { name: 'ServiceUnavailable' }
  )
  const axios504 = Object.assign(new Error('Request failed'), {
    name: 'AxiosError',
    response: { status: 504 },
  })
  const timedOut = Object.assign(new Error('connect ETIMEDOUT'), {
    code: 'ETIMEDOUT',
  })
  const aborted = new DOMException('The operation was aborted', 'TimeoutError')
  const reset = Object.assign(new Error('socket hang up'), {
    code: 'ECONNRESET',
  })

  it.each([
    ['commercetools SDK 503', commercetools503, 503],
    ['commercetools SDK 502 (by name)', commercetools502ByName, 502],
    ['fetch: connection refused (cause)', fetchRefused, 503],
    ['Algolia ApiError 502', algoliaApi502, 502],
    ['Algolia RetryError (no host answers)', algoliaUnreachable, 503],
    ['Contentful 503', contentful503, 503],
    ['axios-shaped 504', axios504, 504],
    ['ETIMEDOUT', timedOut, 504],
    ['AbortSignal.timeout()', aborted, 504],
    ['ECONNRESET', reset, 503],
  ])(
    '%s: the generic body of its status, never its message',
    (_, error, status) => {
      const { host, getStatus, getJson, request } = createHttpHostMock()
      new HttpErrorFilter().catch(error, host)
      expect(getStatus()).toBe(status)
      expect(getJson()).toEqual({
        statusCode: status,
        message: {
          502: 'Bad gateway',
          503: 'Service unavailable',
          504: 'Gateway timeout',
        }[status],
      })
      expect(request.__nestException).toHaveProperty('stack')
    }
  )

  it('an SDK error of another status (a 400, a 500 of our own) stays 500', () => {
    for (const error of [
      Object.assign(new Error('bad'), { name: 'BadRequest', statusCode: 400 }),
      Object.assign(new Error('x'), { statusCode: 500 }),
      new TypeError('cannot read properties of undefined'),
    ]) {
      const { host, getStatus } = createHttpHostMock()
      new HttpErrorFilter().catch(error, host)
      expect(getStatus()).toBe(500)
    }
  })
})

describe("HttpErrorFilter: a route's own 400", () => {
  it.each([
    ['a message string', new BadRequestException('q: 2 to 100 characters')],
    [
      'an object with a message',
      new BadRequestException({ message: 'q: 2 to 100 characters' }),
    ],
  ])('keeps its own message (%s)', (_, exception) => {
    const { host, getStatus, getJson } = createHttpHostMock()
    new HttpErrorFilter().catch(exception, host)
    expect(getStatus()).toBe(400)
    expect(getJson()).toEqual({
      statusCode: 400,
      message: 'q: 2 to 100 characters',
    })
  })

  it('input validation keeps "Validation failed" with its issues', () => {
    const { host, getJson } = createHttpHostMock()
    const issues = new ZodError([
      { code: 'custom', path: ['q'], message: 'Required' },
    ]).issues
    new HttpErrorFilter().catch(
      new FrontendInputValidationException(issues),
      host
    )
    expect(getJson()).toMatchObject({
      statusCode: 400,
      message: 'Validation failed',
      issues,
    })
  })
})
