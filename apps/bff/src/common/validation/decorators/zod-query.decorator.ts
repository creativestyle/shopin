import { Query } from '@nestjs/common'
import { ZodValidationPipe } from '../zod-validation.pipe'
import type { z } from 'zod'

/**
 * Parameter decorator factory that applies Zod validation to query parameters
 *
 * When property is provided, validates the single extracted query value.
 * When property is not provided, validates the entire query object.
 *
 * @param schema - Zod schema for validation
 * @param property - Optional property name to extract from query
 * @returns Parameter decorator
 *
 * @example
 * ```typescript
 * // Validate single query value
 * async getPdpData(
 *   @ZodQuery(z.string().optional(), 'variantId') variantId?: string
 * )
 *
 * // Validate entire query object
 * async searchProducts(
 *   @ZodQuery(SearchQuerySchema) query: { variantId?: string; page?: number }
 * )
 * ```
 */
export function ZodQuery<T extends z.ZodType>(
  schema: T,
  property?: string
): ParameterDecorator {
  const pipe = new ZodValidationPipe(schema, property)
  return property ? Query(property, pipe) : Query(pipe)
}
