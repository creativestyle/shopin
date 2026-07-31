/**
 * @jest-environment node
 */
import { CustomerService } from '../customer-bff-service'
import { InvalidCurrentPasswordError } from '../invalid-current-password-error'
import { RateLimitError } from '@/lib/bff/utils/rate-limit-error'
import { INVALID_CURRENT_PASSWORD_CODE } from '@core/contracts/customer/customer'
import type { BffFetchClient } from '@/lib/bff/types'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Answers the CSRF token request, then the password request with the given response. */
function createService(passwordResponse: Response) {
  const fetchMock = jest
    .fn<Promise<Response>, [string, RequestInit?]>()
    .mockImplementation((path) => {
      if (path === '/csrf/token') {
        return Promise.resolve(jsonResponse(200, { token: 'csrf' }))
      }
      return Promise.resolve(passwordResponse)
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

  it('throws InvalidCurrentPasswordError on 401 with the invalid-password code', async () => {
    const { service } = createService(
      jsonResponse(401, {
        statusCode: 401,
        message: 'Unauthorized',
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
