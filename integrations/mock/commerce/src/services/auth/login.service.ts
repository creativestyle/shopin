import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import type {
  LoginRequest,
  LoginResponse,
  TokenFields,
} from '@core/contracts/auth/login'
import { MockSessionService } from '../../session/mock-session.service'
import { moveGuestCartsToCustomer } from '../cart.service'
import { moveGuestOrdersToCustomer } from '../order.service'
import {
  endSession,
  openSession,
  findCustomerByEmail,
  verifyPassword,
} from '../../session/mock-session-store'

@Injectable()
export class MockLoginService {
  constructor(private readonly sessionService: MockSessionService) {}

  async login(
    loginRequest: LoginRequest
  ): Promise<LoginResponse & TokenFields> {
    const customer = findCustomerByEmail(loginRequest.email)
    if (
      !customer ||
      !(await verifyPassword(customer.passwordHash, loginRequest.password))
    ) {
      throw new UnauthorizedException('Invalid email or password')
    }
    if (!customer.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email address before logging in'
      )
    }

    // A fresh session: the guest's tokens must not become customer credentials
    const { tokens } = openSession(customer.id)
    const guestSessionId = await this.sessionService.getSessionId()
    if (guestSessionId) {
      moveGuestCartsToCustomer(guestSessionId, customer.id)
      moveGuestOrdersToCustomer(guestSessionId, customer.id)
      endSession(guestSessionId)
    }

    return { success: true, ...tokens }
  }
}
