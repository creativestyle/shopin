import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { ServerClientService } from '@integrations/commercetools-api'
import { PASSWORD_RESET_TOKEN_TTL_MINUTES } from '@config/constants'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'

@Injectable()
export class CommercetoolsGeneratePasswordTokenService {
  constructor(
    private readonly serverClientService: ServerClientService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(CommercetoolsGeneratePasswordTokenService.name)
  }

  /**
   * Generates a password reset token for a customer by email.
   * @param request - ForgotPasswordRequest containing customer email
   * @returns Password reset token if successful
   */
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const serverClient = this.serverClientService.getClient()

    try {
      const tokenResponse = await serverClient
        .customers()
        .passwordToken()
        .post({
          body: {
            email: request.email,
            ttlMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
          },
        })
        .execute()

      return { success: true, passwordResetToken: tokenResponse.body.value }
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode
      if (statusCode === 404) {
        // Email not found — swallow silently to prevent email enumeration.
        return { success: false }
      }
      throw error
    }
  }
}
