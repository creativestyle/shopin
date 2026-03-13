import {
  Injectable,
  Inject,
  Scope,
  InternalServerErrorException,
} from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { Request } from 'express'
import { randomBytes, timingSafeEqual } from 'crypto'
import {
  CSRF_TOKEN_COOKIE_NAME,
  CSRF_TOKEN_HEADER_NAME,
  CSRF_TOKEN_SIZE_BYTES,
  CSRF_TOKEN_MAX_AGE_MS,
} from '@config/constants'
import { CsrfTokenEncryptionService } from './csrf-token-encryption.service'
import { CookieService } from '../../common/storage/cookie.service'

@Injectable({
  scope: Scope.REQUEST,
})
export class CsrfTokenService {
  constructor(
    private readonly cookieService: CookieService,
    private readonly csrfTokenEncryptionService: CsrfTokenEncryptionService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  /**
   * Generates a cryptographically secure random CSRF token
   * The token is encrypted and signed to prevent forgery via subdomain attacks
   * Uses dedicated CSRF encryption keys separate from access/refresh tokens
   * @returns Encrypted and signed token string
   */
  async generateToken(): Promise<string> {
    // Generate a random token
    const randomToken = randomBytes(CSRF_TOKEN_SIZE_BYTES).toString('base64url')
    // Encrypt and sign the token to prevent forgery
    // Set expiration to match cookie expiration for defense in depth
    return await this.csrfTokenEncryptionService.encryptAndSign(
      randomToken,
      CSRF_TOKEN_MAX_AGE_MS
    )
  }

  /**
   * Sets the CSRF token in a secure cookie
   * @param token - The CSRF token to store
   * @throws InternalServerErrorException if response object or cookie function is unavailable
   */
  setTokenCookie(token: string): void {
    try {
      const options = this.cookieService.createCookieOptions(
        CSRF_TOKEN_MAX_AGE_MS
      )
      this.cookieService.setCookie(CSRF_TOKEN_COOKIE_NAME, token, options)
    } catch {
      throw new InternalServerErrorException(
        'Unable to set CSRF token cookie: response object or cookie function unavailable'
      )
    }
  }

  /**
   * Gets the CSRF token from the cookie
   * @returns The CSRF token from cookie, or undefined if not present
   */
  getTokenFromCookie(): string | undefined {
    return this.cookieService.getCookie(CSRF_TOKEN_COOKIE_NAME)
  }

  /**
   * Gets the CSRF token from the request header
   * @returns The CSRF token from header, or undefined if not present
   */
  getTokenFromHeader(): string | undefined {
    const headerValue =
      this.request.headers[CSRF_TOKEN_HEADER_NAME.toLowerCase()]
    if (typeof headerValue === 'string') {
      return headerValue
    }
    if (Array.isArray(headerValue) && headerValue.length > 0) {
      return headerValue[0]
    }
    return undefined
  }

  /**
   * Validates that the CSRF token from header matches the token in cookie
   * Both tokens are decrypted and verified before comparison to prevent forgery
   * @param headerToken - The encrypted and signed token from the request header
   * @param cookieToken - The encrypted and signed token from the cookie
   * @returns true if tokens match and are valid, false otherwise
   */
  async validateTokens(
    headerToken: string | undefined,
    cookieToken: string | undefined
  ): Promise<boolean> {
    if (!headerToken || !cookieToken) {
      return false
    }

    try {
      // Decrypt and verify both tokens
      // This ensures tokens are signed by our server and prevents forgery
      // Uses dedicated CSRF encryption keys separate from access/refresh tokens
      const decryptedHeaderToken =
        await this.csrfTokenEncryptionService.decryptAndVerify(headerToken)
      const decryptedCookieToken =
        await this.csrfTokenEncryptionService.decryptAndVerify(cookieToken)

      // Use constant-time comparison to prevent timing attacks
      return this.constantTimeCompare(
        decryptedHeaderToken,
        decryptedCookieToken
      )
    } catch {
      // If decryption or verification fails, the tokens are invalid or tampered
      return false
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns true if strings are equal, false otherwise
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    // Convert strings to Buffers for timing-safe comparison
    const bufferA = Buffer.from(a, 'utf8')
    const bufferB = Buffer.from(b, 'utf8')

    return timingSafeEqual(bufferA, bufferB)
  }

  /**
   * Clears the CSRF token cookie
   */
  clearTokenCookie(): void {
    this.cookieService.clearCookie(CSRF_TOKEN_COOKIE_NAME)
  }
}
