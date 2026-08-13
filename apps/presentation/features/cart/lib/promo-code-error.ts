import {
  DiscountCodeErrorReasonSchema,
  type DiscountCodeErrorReason,
} from '@core/contracts/cart/cart'

/**
 * Carries the BFF's rejection reason so the UI can show a specific message.
 * `reason` is null when the response had no recognisable reason (network, 500, unknown code).
 */
export class PromoCodeError extends Error {
  constructor(readonly reason: DiscountCodeErrorReason | null) {
    super(`Promo code rejected: ${reason ?? 'unknown'}`)
    this.name = 'PromoCodeError'
  }
}

/** Reads the reason off a BFF error response; falls back to null when absent or unrecognised. */
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
