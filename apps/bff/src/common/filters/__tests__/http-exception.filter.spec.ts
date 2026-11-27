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

describe('HttpErrorFilter: errors that are not Nest exceptions', () => {
  // a platform's errors are translated where the BFF calls the port (data-source/port-errors.ts); the filter knows
  // no vendor's error shape, so whatever arrives raw is a bug: 500, its message never sent
  it.each([
    [
      'a platform-shaped 503',
      Object.assign(new Error('upstream down'), {
        name: 'ServiceUnavailable',
        statusCode: 503,
      }),
    ],
    [
      'a search-service-shaped RetryError',
      Object.assign(new Error('Unreachable hosts'), { name: 'RetryError' }),
    ],
    [
      'an axios-shaped 504',
      Object.assign(new Error('Request failed'), { response: { status: 504 } }),
    ],
    [
      'a raw network error',
      Object.assign(new Error('connect ECONNREFUSED 10.0.0.1:443'), {
        code: 'ECONNREFUSED',
      }),
    ],
  ])('%s: 500 with the generic body, the stack logged', (_, error) => {
    const { host, getStatus, getJson, request } = createHttpHostMock()
    new HttpErrorFilter().catch(error, host)
    expect(getStatus()).toBe(500)
    expect(getJson()).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    })
    expect(request.__nestException).toHaveProperty('stack')
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
