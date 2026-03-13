import { applyDecorators, UseGuards } from '@nestjs/common'
import { CsrfGuard } from './csrf.guard'

/**
 * Decorator to apply CSRF protection to an endpoint
 *
 * Use this decorator on any state-changing HTTP method (POST, PUT, DELETE, PATCH)
 * to protect against Cross-Site Request Forgery attacks.
 *
 * This decorator validates the CSRF token (via CsrfGuard).
 * Tokens can be reused for multiple requests until they expire.
 *
 * @example
 * ```typescript
 * @Post('example')
 * @UseCsrfGuard()
 * async createExample() {
 *   // Protected endpoint - token can be reused for subsequent requests
 * }
 * ```
 *
 * @see CsrfGuard for validation implementation
 * @see https://datatracker.ietf.org/doc/html/rfc9700 for security best practices
 */
export function UseCsrfGuard() {
  return applyDecorators(UseGuards(CsrfGuard))
}
