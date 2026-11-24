/**
 * @jest-environment node
 */

import { CORRELATION_ID_HEADER } from '@config/constants'
import { HttpError } from '@/lib/error-utils'
import type { BffFetchClient } from '../../types'
import { BaseService } from '../base-service'

class TestService extends BaseService {
  getCart() {
    return this.get('cart', { queryParams: { token: 'secret' } })
  }
}

function serviceReturning(res: Response) {
  const client: BffFetchClient = { fetch: jest.fn().mockResolvedValue(res) }
  return new TestService(client)
}

describe('BaseService error responses', () => {
  it('keeps the status first so HttpError can parse it', async () => {
    const service = serviceReturning(
      new Response(null, {
        status: 409,
        statusText: 'Conflict',
        headers: { [CORRELATION_ID_HEADER]: 'corr-123' },
      })
    )

    const err = await service.getCart().catch((e: unknown) => e)

    expect(HttpError.isConflictError(err)).toBe(true)
    expect((err as Error).message).toBe(
      '409 Conflict (BFF GET cart, correlationId: corr-123)'
    )
  })

  it('omits the correlation id when the header is missing', async () => {
    const service = serviceReturning(
      new Response(null, { status: 500, statusText: 'Internal Server Error' })
    )

    await expect(service.getCart()).rejects.toThrow(
      /^500 Internal Server Error \(BFF GET cart\)$/
    )
  })
})
