import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable, throwError, from } from 'rxjs'
import { catchError, switchMap, tap } from 'rxjs/operators'
import { Ports } from '../../data-source/ports.module'
import { currentProviders, keyOf } from '../../data-source/providers'
import { TokenStorageService } from './token-storage.service'
import { CartIdService } from '../../features/cart-id/cart-id.service'
import { TokenProvider } from './token-provider'
import { AuthLoggerService, authLogContextFromRequest } from '../auth-logging'
import { VaultService } from '../vault/vault.service'
import { DEFAULT_COOKIE_PATH } from '@config/constants'
import { SESSION_COOKIE, setRequestSession } from '../session/session.service'

/** Signs this request's shopper out of the SHOPin session (as the session check does): no link, cookie cleared. */
function endSessionForRequest(context: ExecutionContext): void {
  const http = context.switchToHttp()
  const req = http.getRequest<object>()
  setRequestSession(req, { links: {} })
  http
    .getResponse<{ clearCookie?: (n: string, o: object) => void }>()
    ?.clearCookie?.(SESSION_COOKIE, { path: DEFAULT_COOKIE_PATH })
}

@Injectable()
export class TokenRefreshInterceptor implements NestInterceptor<
  unknown,
  unknown
> {
  private readonly REFRESH_ATTEMPTED_KEY = Symbol('refreshAttempted')

  constructor(
    protected readonly ports: Ports,
    protected readonly tokenStorageService: TokenStorageService,
    protected readonly cartIdService: CartIdService,
    protected readonly tokenProvider: TokenProvider,
    protected readonly authLogger: AuthLoggerService,
    protected readonly vault: VaultService
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>
  ): Observable<unknown> | Promise<Observable<unknown>> {
    return from(this.proactiveRefresh(context)).pipe(
      switchMap(() => next.handle() as unknown as Observable<unknown>),
      catchError((error) => {
        if (this.isUnauthorizedError(error)) {
          return this.handleUnauthorizedError(context, error, next)
        }
        return throwError(() => error)
      })
    ) as unknown as Observable<unknown>
  }

  protected async proactiveRefresh(context?: ExecutionContext): Promise<void> {
    const accessToken = await this.tokenStorageService.getAccessToken()

    if (!accessToken) {
      const refreshToken = await this.tokenStorageService.getRefreshToken()

      if (refreshToken) {
        try {
          // one refresh at a time per session and part (vault), through the commerce part
          await this.refreshCommerceSession()

          this.authLogger.log({
            action: 'token_refresh',
            outcome: 'success',
            ...(context &&
              authLogContextFromRequest(context.switchToHttp().getRequest())),
          })
        } catch (err) {
          const dead = this.isDeadRefresh(err)
          this.authLogger.log({
            action: 'token_refresh',
            outcome: 'failure',
            reason: dead ? 'invalid_token' : 'token_expired',
            ...(context &&
              authLogContextFromRequest(context.switchToHttp().getRequest())),
          })
          if (!dead) {
            throw err
          }
          // the refresh token is spent or revoked: the session is over; the request goes on as a new guest
          // (otherwise every cart, order and payment call fails until the vault cookie expires). A customer's
          // dead token ends the SHOPin session too, in this request: with the platform's own sign-in that token
          // was the sign-in
          const wasCustomer =
            (await this.tokenStorageService.getAuthStatus()) === true
          this.tokenStorageService.clearTokens()
          await this.cartIdService.deleteAllCartIds()
          if (wasCustomer && context) {
            endSessionForRequest(context)
          }
        }
      }
    }
  }

  protected handleUnauthorizedError(
    context: ExecutionContext,
    error: unknown,
    next: CallHandler<unknown>
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest()

    return from(
      (async () => {
        const refreshToken = await this.tokenStorageService.getRefreshToken()

        if (request[this.REFRESH_ATTEMPTED_KEY] || !refreshToken) {
          this.tokenStorageService.clearTokens()
          await this.cartIdService.deleteAllCartIds()
          throw new UnauthorizedException('Authentication failed')
        }

        request[this.REFRESH_ATTEMPTED_KEY] = true

        // one refresh at a time per session and part (vault), through the commerce part

        const newTokens = await this.refreshCommerceSession()

        return newTokens
      })()
    ).pipe(
      tap(() => {
        this.authLogger.log({
          action: 'token_refresh',
          outcome: 'success',
          ...authLogContextFromRequest(request),
        })
      }),
      switchMap(() => next.handle() as unknown as Observable<unknown>),
      catchError((refreshError) => {
        if (
          this.isUnauthorizedError(refreshError) ||
          this.isDeadRefresh(refreshError)
        ) {
          this.authLogger.log({
            action: 'token_refresh',
            outcome: 'failure',
            reason: 'invalid_token',
            ...authLogContextFromRequest(request),
          })
          this.tokenStorageService.clearTokens()
          return throwError(
            () => new UnauthorizedException('Authentication failed')
          )
        }
        return throwError(() => refreshError)
      })
    )
  }

  /**
   * Renews this request's commerce vault entry once, even when parallel requests ask at the same time.
   * Only the commerce part that issued the tokens refreshes them: without a guest session there is nothing
   * to refresh (401), never a fallback to another provider.
   */
  protected async refreshCommerceSession() {
    const session = this.ports.commerce.guestSession
    if (!session) {
      throw new UnauthorizedException('No commerce session to refresh')
    }
    const provider = keyOf(currentProviders().providers.commerce!)
    const tokens = await this.vault.refreshOnce('commerce', provider, (rt) =>
      session.refresh(rt)
    )
    if (!tokens) {
      throw new UnauthorizedException('No session to refresh')
    }
    return tokens
  }

  /** The token endpoint refused the refresh token itself (OAuth `invalid_grant`): it will never work again. */
  protected isDeadRefresh(error: unknown): boolean {
    const e = error as { statusCode?: number; body?: { error?: string } }
    return e?.statusCode === 400 && e.body?.error === 'invalid_grant'
  }

  protected isUnauthorizedError(error: unknown): boolean {
    if (error instanceof UnauthorizedException) {
      return true
    }

    return !!(
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      (error as { statusCode: number }).statusCode === 401
    )
  }
}
