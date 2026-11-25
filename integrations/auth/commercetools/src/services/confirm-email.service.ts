import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { ServerClientService } from '../client/server-client.service'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import { CommercetoolsErrorMatcher } from '../utils/commercetools-error-matcher'

@Injectable()
export class CommercetoolsConfirmEmailService {
  constructor(
    private readonly serverClientService: ServerClientService,
    private readonly logger: PinoLogger,
    private readonly errorMatcher: CommercetoolsErrorMatcher
  ) {
    this.logger.setContext(CommercetoolsConfirmEmailService.name)
  }

  async confirmEmail(
    confirmEmailRequest: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    const client = this.serverClientService.getClient()

    try {
      await client
        .customers()
        .emailConfirm()
        .post({
          body: {
            tokenValue: confirmEmailRequest.tokenValue,
          },
        })
        .execute()

      return { success: true }
    } catch (error) {
      if (this.errorMatcher.isExpiredEmailTokenError(error)) {
        return { success: false, statusCode: 400, message: 'token_expired' }
      }

      if (this.errorMatcher.isInvalidTokenError(error)) {
        return { success: false, statusCode: 400, message: 'token_invalid' }
      }

      this.logger.error({ err: error }, 'Error confirming email')
      return { success: false }
    }
  }
}
