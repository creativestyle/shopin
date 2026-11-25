import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import {
  RefreshTokenRequestSchema,
  type RefreshTokenRequest,
  type RefreshTokenResponse,
} from '@core/contracts/auth/refresh-token'
import { OAuthTokenService } from './oauth-token.service'

@Injectable()
export class CommercetoolsRefreshTokenService {
  constructor(
    private readonly oauthTokenService: OAuthTokenService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(CommercetoolsRefreshTokenService.name)
  }

  async refreshToken(
    refreshTokenRequest: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    const validationResult =
      RefreshTokenRequestSchema.safeParse(refreshTokenRequest)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      throw new UnauthorizedException(
        firstError?.message || 'No refresh token available'
      )
    }

    const { refreshToken } = validationResult.data

    const tokenData = await this.oauthTokenService.requestToken({
      grantType: 'refresh_token',
      formData: {
        refresh_token: refreshToken,
      },
    })

    return {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
    }
  }
}
