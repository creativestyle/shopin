import { Injectable, Scope } from '@nestjs/common'
import type { TokenProvider as TokenProviderContract } from '@core/contracts/core/request-providers'
import { TokenStorageService } from './token-storage.service'

@Injectable({
  scope: Scope.REQUEST,
})
export class TokenProvider implements TokenProviderContract {
  constructor(private readonly tokenStorageService: TokenStorageService) {}

  async getAccessToken(): Promise<string | undefined> {
    return await this.tokenStorageService.getAccessToken()
  }

  async getAuthStatus(): Promise<boolean | undefined> {
    return await this.tokenStorageService.getAuthStatus()
  }
}
