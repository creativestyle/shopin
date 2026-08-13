import { BadRequestException } from '@nestjs/common'

/** A 400 whose `reason` survives the global filter, which otherwise strips unknown fields. */
export class FrontendSafeException extends BadRequestException {
  public readonly reason: string
  public readonly errorType = 'frontend-safe'

  constructor(reason: string) {
    super({ message: 'Bad request', reason, errorType: 'frontend-safe' })
    this.reason = reason
  }
}
