import { Injectable } from '@nestjs/common'
import type { LogoutRequest } from '@core/contracts/auth/logout'
import {
  endSession,
  revokeTokens,
  getSessionId,
} from '../../session/mock-session-store'

@Injectable()
export class MockLogoutService {
  async logout(logoutRequest: LogoutRequest): Promise<void> {
    // Ends the whole session, so nothing of it stays in memory
    const sessionId = getSessionId(logoutRequest.accessToken)
    if (sessionId) {
      endSession(sessionId)
    }
    revokeTokens(logoutRequest.accessToken, logoutRequest.refreshToken)
  }
}
