import { Injectable } from '@nestjs/common'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'
import {
  findCustomerByEmail,
  issuePasswordToken,
} from '../../session/mock-session-store'

@Injectable()
export class MockForgotPasswordService {
  async forgotPassword(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    const customer = findCustomerByEmail(request.email)
    if (!customer) {
      return { success: false }
    }
    return {
      success: true,
      passwordResetToken: issuePasswordToken(customer.id),
    }
  }
}
