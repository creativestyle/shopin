import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type GrantType = 'password' | 'refresh_token' | 'client_credentials'

export interface OAuthTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  scope: string
}

export interface OAuthTokenRequestOptions {
  grantType: GrantType
  formData: Record<string, string>
  endpoint?: string
}

@Injectable()
export class OAuthTokenService {
  constructor(private readonly configService: ConfigService) {}

  getAuthUrl(): string {
    return this.configService.getOrThrow<string>('COMMERCETOOLS_AUTH_URL')
  }

  getProjectKey(): string {
    return this.configService.getOrThrow<string>('COMMERCETOOLS_PROJECT_KEY')
  }

  createBasicAuthCredentials(): string {
    const clientId = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_CLIENT_ID'
    )
    const clientSecret = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_CLIENT_SECRET'
    )
    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  }

  async requestToken(
    options: OAuthTokenRequestOptions
  ): Promise<OAuthTokenResponse> {
    const authUrl = this.getAuthUrl()
    const credentials = this.createBasicAuthCredentials()

    const endpoint = options.endpoint || 'oauth/token'
    const tokenUrl = `${authUrl}/${endpoint}`

    const formData = new URLSearchParams({
      grant_type: options.grantType,
      ...options.formData,
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      throw {
        statusCode: response.status,
        body: errorBody,
      }
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      scope: data.scope,
    }
  }

  /**
   * Revokes an OAuth token
   */
  async revokeToken(
    token: string,
    tokenTypeHint: 'access_token' | 'refresh_token'
  ): Promise<void> {
    const authUrl = this.getAuthUrl()
    const credentials = this.createBasicAuthCredentials()
    const revokeUrl = `${authUrl}/oauth/token/revoke`

    const formData = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
    })

    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    // According to commercetools docs, 200 means success (even if token was invalid)
    // We don't throw on errors - token revocation is best effort
    if (!response.ok && response.status >= 500) {
      throw new Error(`Token revocation failed with status ${response.status}`)
    }
  }
}
