import { Injectable } from '@nestjs/common'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import {
  getCustomer,
  redeemEmailToken,
  saveCustomer,
} from '../../session/mock-session-store'

@Injectable()
export class MockConfirmEmailService {
  async confirmEmail(
    request: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse> {
    const result = redeemEmailToken(request.tokenValue)
    const customer =
      typeof result === 'string' ? undefined : getCustomer(result.customerId)
    if (!customer) {
      const message = typeof result === 'string' ? result : 'token_invalid'
      return { success: false, statusCode: 400, message }
    }
    saveCustomer({
      ...customer,
      isEmailVerified: true,
      version: customer.version + 1,
    })
    return { success: true }
  }
}
