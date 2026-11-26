import { Injectable } from '@nestjs/common'
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import {
  getCustomer,
  hashPassword,
  redeemPasswordToken,
  saveCustomer,
} from '../../session/mock-session-store'

@Injectable()
export class MockResetPasswordService {
  async resetPassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    const result = redeemPasswordToken(request.tokenValue)
    const customer =
      typeof result === 'string' ? undefined : getCustomer(result.customerId)
    if (!customer) {
      const message = typeof result === 'string' ? result : 'token_invalid'
      return { success: false, statusCode: 400, message }
    }
    saveCustomer({
      ...customer,
      passwordHash: await hashPassword(request.newPassword),
      version: customer.version + 1,
    })
    return { success: true }
  }
}
