/**
 * @jest-environment node
 */
import { CustomerService } from '../customer-bff-service'
import { InvalidCurrentPasswordError } from '../invalid-current-password-error'
import { EmailInUseError } from '../email-in-use-error'
import { RateLimitError } from '@/lib/bff/utils/rate-limit-error'
import {
  EMAIL_IN_USE_CODE,
  INVALID_CURRENT_PASSWORD_CODE,
} from '@core/contracts/customer/customer'
import type { BffFetchClient } from '@/lib/bff/types'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Answers the CSRF token request, then the customer request with the given response. */
function createService(customerResponse: Response) {
  const fetchMock = jest
    .fn<Promise<Response>, [string, RequestInit?]>()
    .mockImplementation((path) => {
      if (path === '/csrf/token') {
        return Promise.resolve(jsonResponse(200, { token: 'csrf' }))
      }
      return Promise.resolve(customerResponse)
    })

  const bffFetch: BffFetchClient = { fetch: fetchMock }
  return { service: new CustomerService(bffFetch), fetchMock }
}

const REQUEST = { currentPassword: 'old-password', newPassword: 'newpass123!' }

describe('CustomerService.changePassword', () => {
  it('resolves on 200 with an empty body', async () => {
    const { service } = createService(
      new Response(null, { status: 200, headers: { 'content-length': '0' } })
    )

    await expect(service.changePassword(REQUEST)).resolves.toBeUndefined()
  })

  it('throws InvalidCurrentPasswordError on 400 with the invalid-password code', async () => {
    const { service } = createService(
      jsonResponse(400, {
        statusCode: 400,
        message: 'Bad Request',
        code: INVALID_CURRENT_PASSWORD_CODE,
      })
    )

    await expect(service.changePassword(REQUEST)).rejects.toBeInstanceOf(
      InvalidCurrentPasswordError
    )
  })

  it('throws a generic error on 401 without the code (expired session)', async () => {
    const { service } = createService(
      jsonResponse(401, { statusCode: 401, message: 'Unauthorized' })
    )

    const error = await service.changePassword(REQUEST).catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(InvalidCurrentPasswordError)
    expect((error as Error).message).toMatch(/^401/)
  })

  it('throws RateLimitError on 429', async () => {
    const { service } = createService(
      jsonResponse(429, { statusCode: 429, message: 'Too many requests' })
    )

    await expect(service.changePassword(REQUEST)).rejects.toBeInstanceOf(
      RateLimitError
    )
  })

  it('never puts the password in the URL', async () => {
    const { service, fetchMock } = createService(
      new Response(null, { status: 200, headers: { 'content-length': '0' } })
    )

    await service.changePassword(REQUEST)

    const [path, options] = fetchMock.mock.lastCall ?? []
    expect(path).toBe('/customer/me/password')
    expect(options?.method).toBe('PUT')
    expect(options?.body).toContain('old-password')
  })
})

describe('CustomerService.changeEmail', () => {
  const EMAIL_REQUEST = {
    email: 'new@example.com',
    currentPassword: 'old-password',
  }

  it('resolves with the customer and the verification token', async () => {
    const body = {
      customer: { id: 'c1', email: 'new@example.com', version: 2 },
      emailToken: 'token-1',
    }
    const { service, fetchMock } = createService(jsonResponse(200, body))

    await expect(service.changeEmail(EMAIL_REQUEST)).resolves.toEqual(body)

    const [path, options] = fetchMock.mock.lastCall ?? []
    expect(path).toBe('/customer/me/email')
    expect(options?.method).toBe('PUT')
  })

  it('throws InvalidCurrentPasswordError on 400 with the invalid-password code', async () => {
    const { service } = createService(
      jsonResponse(400, {
        statusCode: 400,
        message: 'Bad Request',
        code: INVALID_CURRENT_PASSWORD_CODE,
      })
    )

    await expect(service.changeEmail(EMAIL_REQUEST)).rejects.toBeInstanceOf(
      InvalidCurrentPasswordError
    )
  })

  it('throws EmailInUseError on 409 with the email-in-use code', async () => {
    const { service } = createService(
      jsonResponse(409, {
        statusCode: 409,
        message: 'Conflict',
        code: EMAIL_IN_USE_CODE,
      })
    )

    await expect(service.changeEmail(EMAIL_REQUEST)).rejects.toBeInstanceOf(
      EmailInUseError
    )
  })

  it('throws a generic error on 409 without the code', async () => {
    const { service } = createService(
      jsonResponse(409, { statusCode: 409, message: 'Conflict' })
    )

    const error = await service.changeEmail(EMAIL_REQUEST).catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(EmailInUseError)
    expect((error as Error).message).toMatch(/^409/)
  })

  it('throws RateLimitError on 429', async () => {
    const { service } = createService(
      jsonResponse(429, { statusCode: 429, message: 'Too many requests' })
    )

    await expect(service.changeEmail(EMAIL_REQUEST)).rejects.toBeInstanceOf(
      RateLimitError
    )
  })
})
