/**
 * @jest-environment node
 */
import { CartService } from '../cart-bff-service'
import { PromoCodeError } from '../promo-code-error'
import { RateLimitError } from '@/lib/bff/utils/rate-limit-error'
import type { BffFetchClient } from '@/lib/bff/types'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/** Answers the CSRF token request, then the cart request with the given response. */
function createService(cartResponse: Response) {
  const fetchMock = jest
    .fn<Promise<Response>, [string, RequestInit?]>()
    .mockImplementation((path) => {
      if (path === '/csrf/token') {
        return Promise.resolve(jsonResponse(200, { token: 'csrf' }))
      }
      return Promise.resolve(cartResponse)
    })

  const bffFetch: BffFetchClient = { fetch: fetchMock }
  return { service: new CartService(bffFetch), fetchMock }
}

describe('CartService.applyDiscountCode', () => {
  it('throws PromoCodeError carrying the reason from a 400', async () => {
    const { service } = createService(
      jsonResponse(400, {
        statusCode: 400,
        message: 'Bad request',
        reason: 'expired',
      })
    )

    const error = await service
      .applyDiscountCode({ code: 'OLD' })
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(PromoCodeError)
    expect((error as PromoCodeError).reason).toBe('expired')
  })

  it('throws RateLimitError on 429', async () => {
    const { service } = createService(
      jsonResponse(429, { statusCode: 429, message: 'Too many requests' })
    )

    await expect(service.applyDiscountCode({ code: 'SAVE10' })).rejects.toThrow(
      RateLimitError
    )
  })
})

describe('CartService.removeDiscountCode', () => {
  it('rejects an empty id before calling the BFF', async () => {
    const { service, fetchMock } = createService(jsonResponse(200, {}))

    await expect(
      service.removeDiscountCode({ discountCodeId: '  ' })
    ).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
