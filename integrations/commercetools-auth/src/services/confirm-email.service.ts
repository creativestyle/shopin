import { Injectable } from '@nestjs/common'
import { ServerClientService } from '@integrations/commercetools-api'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'

@Injectable()
export class CommercetoolsConfirmEmailService {
  constructor(private readonly serverClientService: ServerClientService) {}

  async confirmEmail(
    confirmEmailRequest: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    const client = this.serverClientService.getClient()

    const response = await client
      .customers()
      .emailConfirm()
      .post({
        body: {
          tokenValue: confirmEmailRequest.tokenValue,
        },
      })
      .execute()

    const customer = response.body
    const alreadyVerified = customer?.isEmailVerified === true

    return { success: true, alreadyVerified }
  }
}
