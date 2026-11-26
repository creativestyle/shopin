import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { JWT_CONFIG } from '@config/constants'
import { BaseTokenEncryptionService } from './base-token-encryption.service'

@Injectable()
export class TokenEncryptionService extends BaseTokenEncryptionService {
  constructor(logger: PinoLogger) {
    super(
      JWT_CONFIG,
      'JWT_ENCRYPTION_KEY',
      'JWT_SIGNING_KEY',
      TokenEncryptionService.name,
      logger
    )
  }
}
