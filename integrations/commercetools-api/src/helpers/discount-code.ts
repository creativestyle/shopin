import {
  DiscountCodeError,
  type DiscountCodeErrorReason,
} from '@core/contracts/cart/cart'
import type { CartApiResponse } from '../schemas/cart'

/** CT DiscountCodeState values that mean the code was not applied. */
const DISCOUNT_CODE_STATE_REASONS: Record<string, DiscountCodeErrorReason> = {
  NotValid: 'expired',
  NotActive: 'invalid',
  DoesNotMatchCart: 'notApplicable',
  MaxApplicationReached: 'notApplicable',
  ApplicationStoppedByPreviousDiscount: 'notApplicable',
  ApplicationStoppedByGroupBestDeal: 'notApplicable',
}

/** CT can accept the action and still not grant the discount; the state says so. */
export function findRejectedDiscountCode(
  cart: CartApiResponse,
  code: string
): { id: string; reason: DiscountCodeErrorReason } | undefined {
  const info = cart.discountCodes?.find(
    (entry) => entry.discountCode.obj?.code === code
  )

  if (!info || info.state === 'MatchesCart') {
    return undefined
  }

  return {
    id: info.discountCode.id,
    reason: DISCOUNT_CODE_STATE_REASONS[info.state] ?? 'notApplicable',
  }
}

/** Maps CT's DiscountCodeNonApplicable error to a DiscountCodeError; anything else is returned as is. */
export function toDiscountCodeError(error: unknown): unknown {
  const errors = (
    error as { body?: { errors?: { code?: string; reason?: string }[] } }
  )?.body?.errors

  const nonApplicable = errors?.find(
    (entry) => entry.code === 'DiscountCodeNonApplicable'
  )
  if (!nonApplicable) {
    return error
  }

  return new DiscountCodeError(
    nonApplicable.reason === 'TimeRangeNonApplicable' ? 'expired' : 'invalid'
  )
}
