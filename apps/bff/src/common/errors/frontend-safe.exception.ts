import { BadRequestException } from '@nestjs/common'

/**
 * A 400 whose `reason` code is safe to expose to the frontend.
 * The global filter strips unknown fields from error bodies, so use this when the
 * client needs to distinguish failure causes (e.g. an invalid vs. expired promo code).
 */
export class FrontendSafeException extends BadRequestException {
  public readonly reason: string
  public readonly errorType = 'frontend-safe'

  constructor(reason: string) {
    super({ message: 'Bad request', reason, errorType: 'frontend-safe' })
    this.reason = reason
  }
}
