import { TokenProvider } from '../../common/token-management/token-provider'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { DataSourceFactory } from '../../data-source/data-source.factory'

/**
 * Base service class for services that need authentication and session management.
 * Provides common utility methods for checking login status and ensuring sessions exist.
 */
export abstract class BaseAuthenticatedService {
  protected constructor(
    protected readonly tokenProvider: TokenProvider,
    protected readonly tokenStorageService: TokenStorageService,
    protected readonly dataSourceFactory: DataSourceFactory
  ) {}

  /**
   * Checks if user is logged in (has customer account, not just anonymous session)
   * @returns true if user is logged in, false if guest/anonymous
   */
  protected async isLoggedIn(): Promise<boolean> {
    return (await this.tokenProvider.getAuthStatus()) === true
  }

  /**
   * Ensures an anonymous session exists before operations that require it.
   * Creates anonymous session if no access token is present.
   * Used by cart and wishlist services when creating resources for guests.
   */
  protected async ensureSession(): Promise<void> {
    if (!this.tokenStorageService.hasAccessToken()) {
      const { anonymousSessionService } =
        this.dataSourceFactory.getAuthServices()
      const sessionResult =
        await anonymousSessionService.createAnonymousSession()

      if (!sessionResult.success) {
        throw new Error(
          `Failed to create anonymous session: statusCode ${sessionResult.statusCode}`
        )
      }

      // Store access token and refresh token in HTTP-only cookies
      if (sessionResult.accessToken && sessionResult.refreshToken) {
        await this.tokenStorageService.setTokens(
          {
            accessToken: sessionResult.accessToken,
            refreshToken: sessionResult.refreshToken,
            expiresIn: sessionResult.expiresIn,
          },
          false // User is guest (anonymous session)
        )
      }
    }
  }
}
