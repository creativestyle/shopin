import { Injectable, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, throwError, from } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { TokenRefreshInterceptor } from '../../common/token-management/token-refresh.interceptor'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { CartIdService } from '../cart-id/cart-id.service'
import { TokenProvider } from '../../common/token-management/token-provider'
import { AuthLoggerService } from '../../common/auth-logging'

/**
 * Token refresh interceptor specifically for cart endpoints.
 * Extends TokenRefreshInterceptor but only performs token refresh
 * if a cart ID is present in cookies.
 */
@Injectable()
export class CartTokenRefreshInterceptor extends TokenRefreshInterceptor {
  constructor(
    dataSourceFactory: DataSourceFactory,
    tokenStorageService: TokenStorageService,
    cartIdService: CartIdService,
    tokenProvider: TokenProvider,
    authLogger: AuthLoggerService
  ) {
    super(
      dataSourceFactory,
      tokenStorageService,
      cartIdService,
      tokenProvider,
      authLogger
    )
  }

  protected override async proactiveRefresh(
    context?: ExecutionContext
  ): Promise<void> {
    if (!(await this.hasAnyCartId())) {
      return
    }
    await super.proactiveRefresh(context)
  }

  protected handleUnauthorizedError(
    context: ExecutionContext,
    error: unknown,
    next: CallHandler<unknown>
  ): Observable<unknown> {
    return from(this.hasAnyCartId()).pipe(
      switchMap((hasCartId) => {
        if (!hasCartId) {
          return throwError(() => error)
        }
        return super.handleUnauthorizedError(context, error, next)
      })
    )
  }

  private async hasAnyCartId(): Promise<boolean> {
    const [hasLoggedIn, hasGuest] = await Promise.all([
      this.cartIdService.hasLoggedInCartId(),
      this.cartIdService.hasGuestCartId(),
    ])
    return hasLoggedIn || hasGuest
  }
}
