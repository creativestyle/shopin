import {
  ArgumentsHost,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { HttpErrorFilter } from '../http-exception.filter'
import { ZodError } from 'zod'
import { FrontendInputValidationException } from '../../validation/frontend-input-validation.exception'

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
})
