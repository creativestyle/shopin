import { Injectable } from '@nestjs/common'
import type {
  GenerateEmailTokenRequest,
  GenerateEmailTokenResponse,
} from '@core/contracts/auth/generate-email-token'
import {
  findCustomerByEmail,
  issueEmailToken,
} from '../../session/mock-session-store'

@Injectable()
export class MockGenerateEmailTokenService {
  async generateEmailToken(
    request: GenerateEmailTokenRequest
  ): Promise<GenerateEmailTokenResponse> {
    const customer = findCustomerByEmail(request.email)
    return { emailToken: customer ? issueEmailToken(customer.id) : undefined }
  }
}
