/**
 * Validation module exports
 * Provides centralized access to validation pipes and decorators
 *
 * Note: Validation schemas are located in the @core/contracts package
 * alongside their corresponding response schemas (e.g., product-page.ts)
 */

// Pipes
export { ZodValidationPipe } from './zod-validation.pipe'

// Exceptions
export { FrontendInputValidationException } from './frontend-input-validation.exception'

// Decorators
export { ZodParam } from './decorators/zod-param.decorator'
export { ZodQuery } from './decorators/zod-query.decorator'
export { ZodBody } from './decorators/zod-body.decorator'
