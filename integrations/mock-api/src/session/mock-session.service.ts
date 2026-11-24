import {
  Inject,
  Injectable,
  Optional,
  UnauthorizedException,
} from '@nestjs/common'
import { ACCESS_TOKEN_TOKEN } from '@config/constants'
import type { TokenProvider } from '@apps/bff/src/common/token-management/token-provider'
import {
  getCustomer,
  getSessionCustomerId,
  getSessionId,
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

  async requireCustomer(): Promise<MockCustomer> {
    const customer = getCustomer(await this.getCustomerId())
    if (!customer) {
      throw new UnauthorizedException('No customer session')
    }
    return customer
  }
}
