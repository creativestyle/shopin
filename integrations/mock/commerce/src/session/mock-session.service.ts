import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common'
import { ACCESS_TOKEN_TOKEN } from '@config/constants'
import type { TokenProvider } from '@core/contracts/core/request-providers'
import {
  customerOwner,
  getCustomer,
  getSessionCustomerId,
  getSessionId,
  guestOwner,
  type MockCustomer,
} from './mock-session-store'

/** Resolves the caller's mock session from the BFF access token, like `me()` in commercetools. */
@Injectable()
export class MockSessionService {
  constructor(
    @Optional()
    @Inject(ACCESS_TOKEN_TOKEN)
    private readonly accessTokenProvider?: TokenProvider
  ) {}

  async getSessionId(): Promise<string | undefined> {
    return getSessionId(await this.accessTokenProvider?.getAccessToken())
  }

  async getCustomerId(): Promise<string | undefined> {
    return getSessionCustomerId(await this.getSessionId())
  }

  /** Owner key for what this caller creates: the customer, or the guest session. */
  async getOwner(): Promise<string | undefined> {
    const sessionId = await this.getSessionId()
    const customerId = getSessionCustomerId(sessionId)
    if (customerId) {
      return customerOwner(customerId)
    }
    return sessionId && guestOwner(sessionId)
  }

  async requireCustomer(): Promise<MockCustomer> {
    const customer = getCustomer(await this.getCustomerId())
    if (!customer) {
      throw new UnauthorizedException('No customer session')
    }
    return customer
  }
}
