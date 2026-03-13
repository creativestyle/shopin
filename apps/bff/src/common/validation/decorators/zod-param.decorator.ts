import { Param } from '@nestjs/common'
import { ZodValidationPipe } from '../zod-validation.pipe'
import type { z } from 'zod'

/**
 * Parameter decorator factory that applies Zod validation to route parameters
 *
 * When property is provided, validates the single extracted parameter value.
 * When property is not provided, validates the entire params object.
 *
 * @param schema - Zod schema for validation
 * @param property - Optional property name to extract from params
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * // Validate single param value
 * async getPlpData(
 *   @ZodParam(z.string().min(1), 'categoryKey') categoryKey: string
 * )
 *
 * // Validate entire params object
 * async getPdpData(
 *   @ZodParam(GetPdpDataParamsSchema) params: { productKey: string }
 * )
 * ```
 */
export function ZodParam<T extends z.ZodType>(
  schema: T,
  property?: string
): ParameterDecorator {
  const pipe = new ZodValidationPipe(schema, property)
  return property ? Param(property, pipe) : Param(pipe)
}
