import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { ServerClientService } from '@integrations/commercetools-api'
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import { CommercetoolsErrorMatcher } from '../utils/commercetools-error-matcher'

@Injectable()
export class CommercetoolsResetPasswordService {
  constructor(
    private readonly serverClientService: ServerClientService,
    private readonly logger: PinoLogger,
    private readonly errorMatcher: CommercetoolsErrorMatcher
  ) {
    this.logger.setContext(CommercetoolsResetPasswordService.name)
  }

  /**
   * Resets a customer's password using a password reset token.
   * @param request - ResetPasswordRequest containing tokenValue and newPassword
   * @returns Success result
   */
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    const serverClient = this.serverClientService.getClient()

    try {
      await serverClient
        .customers()
        .passwordReset()
        .post({
          body: {
            tokenValue: request.tokenValue,
            newPassword: request.newPassword,
          },
        })
        .execute()

      return { success: true }
    } catch (error) {
      if (this.errorMatcher.isExpiredPasswordTokenError(error)) {
        return { success: false, statusCode: 400, message: 'token_expired' }
      }

      if (this.errorMatcher.isInvalidTokenError(error)) {
        return { success: false, statusCode: 400 }
      }

      this.logger.error({ err: error }, 'Error resetting password')
      return { success: false }
    }
  }
}
