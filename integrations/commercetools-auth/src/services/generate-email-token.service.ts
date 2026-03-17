import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { ServerClientService } from '@integrations/commercetools-api'
import type {
  GenerateEmailTokenRequest,
  GenerateEmailTokenResponse,
} from '@core/contracts/auth/generate-email-token'
import { EMAIL_TOKEN_TTL_MINUTES } from '@config/constants'

@Injectable()
export class CommercetoolsGenerateEmailTokenService {
  constructor(
    private readonly serverClientService: ServerClientService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(CommercetoolsGenerateEmailTokenService.name)
  }

  /**
   * Generates an email verification token for a customer by email.
   * @param request - GenerateEmailTokenRequest containing customer email
   * @returns Email token if successful, undefined if generation fails
   */
  async generateEmailToken(
    request: GenerateEmailTokenRequest
  ): Promise<GenerateEmailTokenResponse> {
    const serverClient = this.serverClientService.getClient()

    try {
      // Fetch customer by email
      const customersResponse = await serverClient
        .customers()
        .get({
          queryArgs: {
            where: `email="${request.email}"`,
            limit: 1,
          },
        })
        .execute()

      if (
        !customersResponse.body.results?.length ||
        !customersResponse.body.results[0]?.id
      ) {
        this.logger.warn(
          { email: request.email },
          'Customer not found for email'
        )
        return { emailToken: undefined }
      }

      const customer = customersResponse.body.results[0]

      // Generate email token
      const tokenResponse = await serverClient
        .customers()
        .emailToken()
        .post({
          body: {
            id: customer.id,
            ttlMinutes: EMAIL_TOKEN_TTL_MINUTES,
          },
        })
        .execute()

      return { emailToken: tokenResponse.body.value }
    } catch (error) {
      this.logger.error({ err: error }, 'Error generating email token')
      return { emailToken: undefined }
    }
  }
}
