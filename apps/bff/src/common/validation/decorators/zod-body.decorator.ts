import { Body } from '@nestjs/common'
import { ZodValidationPipe } from '../zod-validation.pipe'
import type { z } from 'zod'

/**
 * Parameter decorator factory that applies Zod validation to request body
 *
 * @param schema - Zod schema for validation
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * async createProduct(
 *   @ZodBody(CreateProductSchema) data: CreateProductDto
 * )
 * ```
 */
export function ZodBody<T extends z.ZodType>(schema: T): ParameterDecorator {
  return Body(new ZodValidationPipe(schema))
}
