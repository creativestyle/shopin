import { UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PinoLogger } from 'nestjs-pino'
// This is ESM only package, and we have commonjs
import type * as Jose from 'jose' with { 'resolution-mode': 'import' }

export interface TokenEncryptionConfig {
  KEY_SIZE_BYTES: number
  SIGNING_ALGORITHM: string
  ENCRYPTION_ALGORITHM: string
  ENCRYPTION_METHOD: string
}

export abstract class BaseTokenEncryptionService {
  protected readonly logger: PinoLogger
  protected readonly encryptionKey: Uint8Array
  protected readonly signingKey: Uint8Array
  protected readonly joseModule: Promise<typeof Jose>
  protected readonly config: TokenEncryptionConfig

  constructor(
    protected readonly configService: ConfigService,
    config: TokenEncryptionConfig,
    encryptionKeyEnv: string,
    signingKeyEnv: string,
    serviceName: string,
    logger: PinoLogger
  ) {
    this.logger = logger
    this.logger.setContext(serviceName)
    this.config = config
    this.encryptionKey = this.loadKey(
      encryptionKeyEnv,
      config.ENCRYPTION_METHOD
    )
    this.signingKey = this.loadKey(signingKeyEnv, config.SIGNING_ALGORITHM)
    // This is ESM only package, and we have commonjs
    this.joseModule = import('jose')
  }

  private loadKey(configKey: string, algorithm: string): Uint8Array {
    const keyBase64 = this.configService.getOrThrow<string>(configKey)
    const key = this.base64ToUint8Array(keyBase64)

    if (key.length !== this.config.KEY_SIZE_BYTES) {
      throw new Error(
        `${configKey} must be a base64-encoded ${this.config.KEY_SIZE_BYTES}-byte (256-bit) key for ${algorithm}`
      )
    }

    return key
  }

  /**
   * Encrypts and signs a token using nested JWT (JWS + JWE)
   * Process: Sign with JWS -> Encrypt with JWE
   *
   * @param token - The plain token to protect
   * @param expirationTimeMs - Optional expiration time in milliseconds from now
   * @returns Encrypted and signed token (JWE containing JWS)
   */
  async encryptAndSign(
    token: string,
    expirationTimeMs?: number
  ): Promise<string> {
    try {
      const { SignJWT, EncryptJWT } = await this.joseModule

      // Step 1: Sign the token with JWS using HS256
      const signJWT = new SignJWT({ token })
        .setProtectedHeader({ alg: this.config.SIGNING_ALGORITHM })
        .setIssuedAt()

      // Set expiration on JWS if provided
      if (expirationTimeMs !== undefined) {
        signJWT.setExpirationTime(new Date(Date.now() + expirationTimeMs))
      }

      const signedToken = await signJWT.sign(this.signingKey)

      // Step 2: Encrypt the signed token with JWE using A256GCM
      const encryptJWT = new EncryptJWT({ jws: signedToken })
        .setProtectedHeader({
          alg: this.config.ENCRYPTION_ALGORITHM,
          enc: this.config.ENCRYPTION_METHOD,
        })
        .setIssuedAt()

      // Set expiration on JWE if provided (defense in depth)
      if (expirationTimeMs !== undefined) {
        encryptJWT.setExpirationTime(new Date(Date.now() + expirationTimeMs))
      }

      const encryptedToken = await encryptJWT.encrypt(this.encryptionKey)

      return encryptedToken
    } catch (error) {
      this.logger.error({ error }, 'Failed to encrypt and sign token')
      throw new UnauthorizedException('Token encryption failed')
    }
  }

  /**
   * Decrypts and verifies a token (reverse of encryptAndSign)
   * Process: Decrypt JWE -> Verify JWS signature -> Extract token
   *
   * @param encryptedToken - The encrypted and signed token
   * @returns The original plain token
   * @throws UnauthorizedException if decryption or signature verification fails
   */
  async decryptAndVerify(encryptedToken: string): Promise<string> {
    try {
      const { jwtDecrypt, jwtVerify } = await this.joseModule

      // Step 1: Decrypt the JWE token
      // For direct encryption (alg: 'dir'), the algorithm is in the JWE header
      // jose v6 automatically validates the algorithm and exp claim from the token header
      const { payload } = await jwtDecrypt(encryptedToken, this.encryptionKey)

      // Extract the JWS token from the decrypted payload
      const signedToken = this.extractString(
        payload,
        'jws',
        'Invalid token structure after decryption'
      )

      // Step 2: Verify the JWS signature
      // jwtVerify automatically validates exp claim if present
      const { payload: jwsPayload } = await jwtVerify(
        signedToken,
        this.signingKey,
        {
          algorithms: [this.config.SIGNING_ALGORITHM],
        }
      )

      // Step 3: Extract the original token from verified JWS payload
      return this.extractString(
        jwsPayload,
        'token',
        'Invalid token in JWS payload'
      )
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      // Log security events for decryption/verification failures
      this.logger.warn(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Token decryption or verification failed'
      )

      throw new UnauthorizedException('Invalid or tampered token')
    }
  }

  protected extractString(
    payload: unknown,
    key: string,
    logMessage: string
  ): string {
    if (typeof payload === 'object' && payload !== null && key in payload) {
      const value = (payload as Record<string, unknown>)[key]
      if (typeof value === 'string') {
        return value
      }
    }

    this.logger.warn(logMessage)
    throw new UnauthorizedException('Invalid token format')
  }

  /**
   * Converts a base64-encoded string to Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    try {
      return new Uint8Array(Buffer.from(base64, 'base64'))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Invalid base64 key format: ${message}`)
    }
  }
}
