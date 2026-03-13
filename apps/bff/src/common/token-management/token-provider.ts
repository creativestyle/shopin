import { Injectable, Scope } from '@nestjs/common'
import { TokenStorageService } from './token-storage.service'

@Injectable({
  scope: Scope.REQUEST,
})
export class TokenProvider {
  constructor(private readonly tokenStorageService: TokenStorageService) {}

  async getAccessToken(): Promise<string | undefined> {
    return await this.tokenStorageService.getAccessToken()
  }

  async getAuthStatus(): Promise<boolean | undefined> {
    return await this.tokenStorageService.getAuthStatus()
  }
}
