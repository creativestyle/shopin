import { Injectable, Scope } from '@nestjs/common'
import type { TokenProvider as TokenProviderContract } from '@core/contracts/core/request-providers'
import { TokenStorageService } from './token-storage.service'
import { SessionService } from '../session/session.service'

@Injectable({
  scope: Scope.REQUEST,
})
export class TokenProvider implements TokenProviderContract {
  constructor(
    private readonly tokenStorageService: TokenStorageService,
    private readonly session: SessionService
  ) {}

  async getAccessToken(): Promise<string | undefined> {
    return await this.tokenStorageService.getAccessToken()
  }

  /** Signed in at this commerce provider: the SHOPin session links a customer there. */
  async getAuthStatus(): Promise<boolean | undefined> {
    return (await this.session.linkedCustomer()) !== undefined
  }
}
