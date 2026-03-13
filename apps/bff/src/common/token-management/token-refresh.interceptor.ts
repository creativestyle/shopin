import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable, throwError, from } from 'rxjs'
import { catchError, switchMap, tap } from 'rxjs/operators'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { TokenStorageService } from './token-storage.service'
import { CartIdService } from '../../features/cart-id/cart-id.service'
import { TokenProvider } from './token-provider'
import { AuthLoggerService, authLogContextFromRequest } from '../auth-logging'

@Injectable()
export class TokenRefreshInterceptor implements NestInterceptor<
  unknown,
  unknown
> {
  private readonly REFRESH_ATTEMPTED_KEY = Symbol('refreshAttempted')

  constructor(
    protected readonly dataSourceFactory: DataSourceFactory,
    protected readonly tokenStorageService: TokenStorageService,
    protected readonly cartIdService: CartIdService,
    protected readonly tokenProvider: TokenProvider,
    protected readonly authLogger: AuthLoggerService
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
          // Preserve auth status before refreshing
          const authStatus = await this.tokenStorageService.getAuthStatus()
          const isAuthenticated = authStatus === true

          const { refreshTokenService } =
            this.dataSourceFactory.getAuthServices()
          const newTokens = await refreshTokenService.refreshToken({
            refreshToken,
          })

          await this.tokenStorageService.setAccessToken(
            newTokens.accessToken,
            newTokens.expiresIn,
            isAuthenticated ?? false // Default to false if status unknown
          )

          if (
            newTokens.refreshToken &&
            typeof newTokens.refreshToken === 'string' &&
            newTokens.refreshToken.trim() !== ''
          ) {
            await this.tokenStorageService.setRefreshToken(
              newTokens.refreshToken
            )
          }
          this.authLogger.log({
            action: 'token_refresh',
            outcome: 'success',
            ...(context &&
              authLogContextFromRequest(context.switchToHttp().getRequest())),
          })
        } catch (err) {
          this.authLogger.log({
            action: 'token_refresh',
            outcome: 'failure',
            reason: 'token_expired',
            ...(context &&
              authLogContextFromRequest(context.switchToHttp().getRequest())),
          })
          throw err
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

        // Preserve auth status before refreshing
        const authStatus = await this.tokenStorageService.getAuthStatus()
        const isAuthenticated = authStatus === true

        const { refreshTokenService } = this.dataSourceFactory.getAuthServices()
        const newTokens = await refreshTokenService.refreshToken({
          refreshToken,
        })

        await this.tokenStorageService.setAccessToken(
          newTokens.accessToken,
          newTokens.expiresIn,
          isAuthenticated ?? false // Default to false if status unknown
        )

        if (
          newTokens.refreshToken &&
          typeof newTokens.refreshToken === 'string' &&
          newTokens.refreshToken.trim() !== ''
        ) {
          await this.tokenStorageService.setRefreshToken(newTokens.refreshToken)
        }

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
        if (this.isUnauthorizedError(refreshError)) {
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
