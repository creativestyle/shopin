import { Injectable, Scope } from '@nestjs/common'
import { z } from 'zod'
import type { TokenFields } from '@core/contracts/auth/login'
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE,
} from '@config/constants'
import { TokenEncryptionService } from './token-encryption.service'
import { CookieService } from '../storage/cookie.service'

const AccessTokenPayloadSchema = z.object({
  token: z.string(),
  meta: z.object({
    isAuthenticated: z.boolean(),
  }),
})

type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>

@Injectable({
  scope: Scope.REQUEST,
})
export class TokenStorageService {
  constructor(
    private readonly cookieService: CookieService,
    private readonly tokenEncryptionService: TokenEncryptionService
  ) {}

  async setAccessToken(
    accessToken: string,
    expiresIn: number,
    isAuthenticated: boolean
  ): Promise<void> {
    const accessTokenMaxAge = expiresIn * 1000
    // Store token and auth status in meta object
    const tokenPayload = JSON.stringify({
      token: accessToken,
      meta: {
        isAuthenticated,
      },
    })
    // Encrypt and sign with expiration matching the underlying token expiration
    const encryptedToken = await this.tokenEncryptionService.encryptAndSign(
      tokenPayload,
      accessTokenMaxAge
    )
    const options = this.cookieService.createCookieOptions(accessTokenMaxAge)
    this.cookieService.setCookie(
      ACCESS_TOKEN_COOKIE_NAME,
      encryptedToken,
      options
    )
  }

  async setRefreshToken(refreshToken: string): Promise<void> {
    // Encrypt and sign with expiration matching the cookie expiration
    const encryptedToken = await this.tokenEncryptionService.encryptAndSign(
      refreshToken,
      REFRESH_TOKEN_MAX_AGE
    )
    const options = this.cookieService.createCookieOptions(
      REFRESH_TOKEN_MAX_AGE
    )
    this.cookieService.setCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      encryptedToken,
      options
    )
  }

  async setTokens(
    tokens: TokenFields,
    isAuthenticated: boolean
  ): Promise<void> {
    try {
      await Promise.all([
        this.setAccessToken(
          tokens.accessToken,
          tokens.expiresIn,
          isAuthenticated
        ),
        this.setRefreshToken(tokens.refreshToken),
      ])
    } catch (error) {
      this.clearTokens()
      throw error
    }
  }

  clearTokens(): void {
    this.cookieService.clearCookie(ACCESS_TOKEN_COOKIE_NAME)
    this.cookieService.clearCookie(REFRESH_TOKEN_COOKIE_NAME)
  }

  /**
   * Checks if access token cookie exists without decrypting
   * @returns true if access token cookie exists, false otherwise
   */
  hasAccessToken(): boolean {
    return this.cookieService.hasCookie(ACCESS_TOKEN_COOKIE_NAME)
  }

  async getAccessToken(): Promise<string | undefined> {
    const payload = await this.getAccessTokenPayload()
    return payload?.token
  }

  /**
   * Get authentication status from encrypted access token
   * @returns true if authenticated, false if guest, undefined if not set or token invalid
   */
  async getAuthStatus(): Promise<boolean | undefined> {
    const payload = await this.getAccessTokenPayload()
    return payload?.meta?.isAuthenticated
  }

  /**
   * Decrypt and parse the access token payload from cookie
   * @returns Parsed payload or undefined if invalid/missing
   */
  private async getAccessTokenPayload(): Promise<
    AccessTokenPayload | undefined
  > {
    const encryptedToken = this.cookieService.getCookie(
      ACCESS_TOKEN_COOKIE_NAME
    )
    if (!encryptedToken) {
      return undefined
    }

    try {
      const decrypted =
        await this.tokenEncryptionService.decryptAndVerify(encryptedToken)
      const parsed = JSON.parse(decrypted)
      const result = AccessTokenPayloadSchema.safeParse(parsed)

      if (!result.success) {
        return undefined
      }

      return result.data
    } catch {
      this.cookieService.clearCookie(ACCESS_TOKEN_COOKIE_NAME)
      return undefined
    }
  }

  async getRefreshToken(): Promise<string | undefined> {
    const encryptedToken = this.cookieService.getCookie(
      REFRESH_TOKEN_COOKIE_NAME
    )
    if (!encryptedToken) {
      return undefined
    }

    try {
      return await this.tokenEncryptionService.decryptAndVerify(encryptedToken)
    } catch {
      this.cookieService.clearCookie(REFRESH_TOKEN_COOKIE_NAME)
      return undefined
    }
  }

  async getTokens(): Promise<{
    accessToken?: string
    refreshToken?: string
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken(),
      this.getRefreshToken(),
    ])

    return {
      accessToken,
      refreshToken,
    }
  }
}
