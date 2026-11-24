import {
  DiscountCodeErrorReasonSchema,
  type DiscountCodeErrorReason,
} from '@core/contracts/cart/cart'

/** `reason` is null when the response carried no recognisable one (network, 500, unknown code). */
export class PromoCodeError extends Error {
  constructor(readonly reason: DiscountCodeErrorReason | null) {
    super(`Promo code rejected: ${reason ?? 'unknown'}`)
    this.name = 'PromoCodeError'
  }
}

export async function toPromoCodeError(
  response: Response
): Promise<PromoCodeError> {
  try {
    const body: unknown = await response.json()
    const reason = (body as { reason?: unknown })?.reason
    const parsed = DiscountCodeErrorReasonSchema.safeParse(reason)
    return new PromoCodeError(parsed.success ? parsed.data : null)
  } catch {
    return new PromoCodeError(null)
  }
}
