import { TokenProvider } from '../../common/token-management/token-provider'
import { TokenStorageService } from '../../common/token-management/token-storage.service'
import { Services, Ports } from '../../data-source/ports.module'

/**
 * Base service class for services that need authentication and session management.
 * Provides common utility methods for checking login status and ensuring sessions exist.
 */
export abstract class BaseAuthenticatedService {
  protected constructor(
    protected readonly tokenProvider: TokenProvider,
    protected readonly tokenStorageService: TokenStorageService,
    protected readonly services: Services,
    protected readonly ports: Ports
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
    // A commerce part that needs a guest session (an anonymous token) supplies one; others need none.
    const commerceSession = this.ports.commerce.guestSession
    if (!commerceSession || (await this.tokenStorageService.hasAccessToken())) {
      return
    }
    const tokens = await commerceSession.createGuestSession()
    await this.tokenStorageService.setTokens(tokens, false)
  }
}
