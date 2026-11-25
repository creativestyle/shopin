import { Injectable, Scope, Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ACCESS_TOKEN_TOKEN } from '@config/constants'
import type { TokenProvider } from '@core/contracts/core/request-providers'
import {
  createTokenClient,
  type Client,
} from '@integrations/commercetools-core'

@Injectable({ scope: Scope.REQUEST })
export class UserClientService {
  private clientInstance: Client | null = null
  private cachedAccessToken: string | undefined = undefined

  constructor(
    private readonly configService: ConfigService,
    @Inject(ACCESS_TOKEN_TOKEN)
    private readonly accessTokenProvider: TokenProvider
  ) {}

  async getClient(): Promise<Client> {
    const currentAccessToken = await this.accessTokenProvider.getAccessToken()

    // Recreate client if token changed or client doesn't exist
    if (!this.clientInstance || this.cachedAccessToken !== currentAccessToken) {
      const projectKey = this.configService.getOrThrow<string>(
        'COMMERCETOOLS_PROJECT_KEY'
      )
      const apiUrl = this.configService.getOrThrow<string>(
        'COMMERCETOOLS_API_URL'
      )

      this.clientInstance = createTokenClient({
        accessToken: currentAccessToken,
        apiUrl,
        projectKey,
      })
      this.cachedAccessToken = currentAccessToken
    }

    return this.clientInstance
  }
}
