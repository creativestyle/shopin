import { Injectable, UnauthorizedException } from '@nestjs/common'
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@core/contracts/auth/refresh-token'
import { refreshSession } from '../../session/mock-session-store'

@Injectable()
export class MockRefreshTokenService {
  async refreshToken(
    refreshTokenRequest: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    const tokens = refreshSession(refreshTokenRequest.refreshToken)
    if (!tokens) {
      throw new UnauthorizedException('Invalid refresh token')
    }
    return tokens
  }
}
