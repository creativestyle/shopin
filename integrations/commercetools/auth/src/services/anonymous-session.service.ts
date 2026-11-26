import { Injectable } from '@nestjs/common'
import type {
  AnonymousSessionResponse,
  AnonymousSessionTokenFields,
} from '@core/contracts/auth/anonymous-session'
import { createAnonymousSessionScope } from '../scopes'
import { OAuthTokenService } from './oauth-token.service'

@Injectable()
export class CommercetoolsAnonymousSessionService {
  constructor(private readonly oauthTokenService: OAuthTokenService) {}

  async createAnonymousSession(): Promise<
    AnonymousSessionResponse & AnonymousSessionTokenFields
  > {
    const projectKey = this.oauthTokenService.getProjectKey()

    const tokenData = await this.oauthTokenService.requestToken({
      grantType: 'client_credentials',
      endpoint: `oauth/${projectKey}/anonymous/token`,
      formData: {
        scope: createAnonymousSessionScope(projectKey),
      },
    })

    return {
      success: true,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
    }
  }
}
