import { Injectable } from '@nestjs/common'
import type { Port, SessionTokens } from '@core/integration-kit'
import { OAuthTokenService } from './oauth-token.service'
import { createAnonymousSessionScope } from './scopes'

/**
 * The commerce part's own guest session: commercetools' "me" API needs an anonymous token for guest carts,
 * whichever identity provider (if any) is chosen. The core stores it in the commerce part's vault entry.
 */
@Injectable()
export class CommercetoolsGuestSessionService implements NonNullable<
  Port<'commerce'>['guestSession']
> {
  constructor(private readonly oauth: OAuthTokenService) {}

  async createGuestSession(): Promise<SessionTokens> {
    const projectKey = this.oauth.getProjectKey()
    const t = await this.oauth.requestToken({
      grantType: 'client_credentials',
      endpoint: `oauth/${projectKey}/anonymous/token`,
      formData: { scope: createAnonymousSessionScope(projectKey) },
    })
    return {
      accessToken: t.accessToken,
      refreshToken: t.refreshToken,
      expiresIn: t.expiresIn,
    }
  }

  async refresh(refreshToken: string): Promise<SessionTokens> {
    const t = await this.oauth.requestToken({
      grantType: 'refresh_token',
      formData: { refresh_token: refreshToken },
    })
    return {
      accessToken: t.accessToken,
      // commercetools' refresh grant returns no new refresh token: the one given stays valid
      refreshToken: t.refreshToken || refreshToken,
      expiresIn: t.expiresIn,
    }
  }
}
