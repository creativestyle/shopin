import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import type { LogoutRequest } from '@core/contracts/auth/logout'
import { OAuthTokenService } from './oauth-token.service'

@Injectable()
export class CommercetoolsLogoutService {
  constructor(
    private readonly oauthTokenService: OAuthTokenService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(CommercetoolsLogoutService.name)
  }

  async logout(logoutRequest: LogoutRequest): Promise<void> {
    const { accessToken, refreshToken } = logoutRequest

    // If no tokens are present, nothing to revoke
    if (!accessToken && !refreshToken) {
      return
    }

    // Revoke both tokens if they exist
    const revokePromises: Promise<void>[] = []

    if (accessToken) {
      revokePromises.push(this.revokeToken(accessToken, 'access_token'))
    }

    if (refreshToken) {
      revokePromises.push(this.revokeToken(refreshToken, 'refresh_token'))
    }

    // Revoke all tokens in parallel
    // We don't throw errors here - even if revocation fails, we still want to clear cookies
    await Promise.allSettled(revokePromises)
  }

  private async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token'
  ): Promise<void> {
    try {
      await this.oauthTokenService.revokeToken(token, tokenTypeHint)
    } catch (error) {
      // Log but don't throw - we'll still clear cookies
      this.logger.warn({ err: error }, 'Token revocation request failed')
    }
  }
}
