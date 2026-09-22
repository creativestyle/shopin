import { PromoCodeError, toPromoCodeError } from '../promo-code-error'

function responseWith(body: unknown): Response {
  return {
    json: async () => body,
  } as Response
}

describe('toPromoCodeError', () => {
  it.each(['invalid', 'expired', 'notApplicable', 'alreadyApplied'] as const)(
    'keeps the %s reason from the response body',
    async (reason) => {
      const error = await toPromoCodeError(
        responseWith({ statusCode: 400, message: 'Bad request', reason })
      )

      expect(error).toBeInstanceOf(PromoCodeError)
      expect(error.reason).toBe(reason)
    }
  )

  it('falls back to null for an unrecognised reason', async () => {
    const error = await toPromoCodeError(
      responseWith({ statusCode: 400, reason: 'somethingElse' })
    )

    expect(error.reason).toBeNull()
  })

  it('falls back to null when the body has no reason', async () => {
    const error = await toPromoCodeError(
      responseWith({ statusCode: 500, message: 'Internal server error' })
    )

    expect(error.reason).toBeNull()
  })

  it('falls back to null when the body is not JSON', async () => {
    const response = {
      json: async () => {
        throw new SyntaxError('Unexpected token')
      },
    } as unknown as Response

    const error = await toPromoCodeError(response)

    expect(error.reason).toBeNull()
  })
})
