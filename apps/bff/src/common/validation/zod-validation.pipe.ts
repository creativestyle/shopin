import { PipeTransform, Injectable } from '@nestjs/common'
import { z } from 'zod'
import { FrontendInputValidationException } from './frontend-input-validation.exception'

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(
    private readonly schema: z.ZodType<unknown>,
    private readonly fieldName?: string
  ) {}

  transform(value: unknown) {
    // Handle undefined/null values - let schema validation decide if they're valid
    const valueToValidate = value === undefined ? undefined : value

    const result = this.schema.safeParse(valueToValidate)
    if (!result.success) {
      // Enhance errors with field name in path if provided
      const enhancedIssues = result.error.issues.map((issue) => ({
        ...issue,
        path: this.fieldName ? [this.fieldName, ...issue.path] : issue.path,
      }))
      throw new FrontendInputValidationException(enhancedIssues)
    }
    return result.data
  }
}
