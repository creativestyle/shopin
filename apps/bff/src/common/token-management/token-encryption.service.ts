import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PinoLogger } from 'nestjs-pino'
import { JWT_CONFIG } from '@config/constants'
import { BaseTokenEncryptionService } from './base-token-encryption.service'

@Injectable()
export class TokenEncryptionService extends BaseTokenEncryptionService {
  constructor(configService: ConfigService, logger: PinoLogger) {
    super(
      configService,
      JWT_CONFIG,
      'JWT_ENCRYPTION_KEY',
      'JWT_SIGNING_KEY',
      TokenEncryptionService.name,
      logger
    )
  }
}
