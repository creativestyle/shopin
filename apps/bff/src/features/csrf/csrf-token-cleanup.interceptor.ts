import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { CsrfTokenService } from './csrf-token.service'

/**
 * Interceptor that clears CSRF token after successful state-changing operations
 *
 * This interceptor runs after the controller method completes successfully.
 * It clears the CSRF token cookie to prevent token reuse, implementing
 * single-use token pattern for enhanced security.
 *
 * Only clears tokens for successful responses (2xx status codes).
 * Failed requests keep the token valid for retry attempts.
 */
@Injectable()
export class CsrfTokenCleanupInterceptor implements NestInterceptor {
  constructor(private readonly csrfTokenService: CsrfTokenService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>
  ): Observable<unknown> | Promise<Observable<unknown>> {
    return (next.handle() as unknown as Observable<unknown>).pipe(
      tap({
        next: () => {
          // Clear CSRF token after successful response
          // The tap operator's next callback runs when the observable emits a value
          // which means the controller method completed successfully
          this.csrfTokenService.clearTokenCookie()
        },
        error: () => {
          // Don't clear token on error - allow retry with same token
        },
      })
    ) as unknown as Observable<unknown>
  }
}
