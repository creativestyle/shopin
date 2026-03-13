import { BadRequestException } from '@nestjs/common'
import type { ZodError } from 'zod'

export class FrontendInputValidationException extends BadRequestException {
  public readonly issues: ZodError['issues']
  public readonly errorType = 'frontend-input-validation'
  constructor(issues: ZodError['issues']) {
    super({
      message: 'Validation failed',
      issues,
      errorType: 'frontend-input-validation',
    })
    this.issues = issues
  }
}
