import { Injectable, Scope } from '@nestjs/common'
import type { TokenFields } from '@core/contracts/auth/login'
import { VaultService } from '../vault/vault.service'
import { currentProviders, keyOf } from '../../data-source/providers'

/**
 * The core's view of this request's commerce part vault entry (`vault.commerce.<provider>`): the guest or
 * customer token the commerce part acts with. Same entry the part reads through its injected TokenVault.
 */
@Injectable({ scope: Scope.REQUEST })
export class TokenStorageService {
  constructor(private readonly vault: VaultService) {}

  private get provider(): string {
    return keyOf(currentProviders().providers.commerce!)
  }

  /** `customerId`: for a customer's tokens, the customer they belong to (the vault keeps them only for that link). */
  async setTokens(
    tokens: TokenFields,
    isAuthenticated: boolean,
    customerId?: string
  ): Promise<void> {
    await this.vault.set(
      'commerce',
      this.provider,
      tokens,
      isAuthenticated,
      customerId
    )
  }

  clearTokens(): void {
    this.vault.clear('commerce', this.provider)
  }

  /**
   * A usable entry exists (possibly expired: the refresh interceptor renews it). Read through the vault, so a cookie the
   * vault no longer trusts (a customer token whose session is gone) counts as none and a guest session is created.
   */
  async hasAccessToken(): Promise<boolean> {
    return (await this.vault.entry('commerce', this.provider)) !== undefined
  }

  async getAccessToken(): Promise<string | undefined> {
    const e = await this.vault.entry('commerce', this.provider)
    return e && !e.expired ? e.accessToken : undefined
  }

  async getAuthStatus(): Promise<boolean | undefined> {
    return (await this.vault.entry('commerce', this.provider))?.customer
  }

  async getRefreshToken(): Promise<string | undefined> {
    return (
      (await this.vault.entry('commerce', this.provider))?.refreshToken ||
      undefined
    )
  }

  async getTokens(): Promise<{ accessToken?: string; refreshToken?: string }> {
    return {
      accessToken: await this.getAccessToken(),
      refreshToken: await this.getRefreshToken(),
    }
  }
}
