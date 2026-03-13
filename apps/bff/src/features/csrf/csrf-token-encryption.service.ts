import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PinoLogger } from 'nestjs-pino'
import { CSRF_TOKEN_CONFIG } from '@config/constants'
import { BaseTokenEncryptionService } from '../../common/token-management/base-token-encryption.service'

@Injectable()
export class CsrfTokenEncryptionService extends BaseTokenEncryptionService {
  constructor(configService: ConfigService, logger: PinoLogger) {
    super(
      configService,
      CSRF_TOKEN_CONFIG,
      'CSRF_TOKEN_ENCRYPTION_KEY',
      'CSRF_TOKEN_SIGNING_KEY',
      CsrfTokenEncryptionService.name,
      logger
    )
  }
}
