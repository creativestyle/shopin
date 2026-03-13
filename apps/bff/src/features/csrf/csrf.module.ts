import { Module, Global } from '@nestjs/common'
import { CsrfController } from './csrf.controller'
import { CsrfTokenEncryptionService } from './csrf-token-encryption.service'
import { CsrfTokenService } from './csrf-token.service'
import { CsrfGuard } from './csrf.guard'
import { CsrfTokenCleanupInterceptor } from './csrf-token-cleanup.interceptor'

@Global()
@Module({
  controllers: [CsrfController],
  providers: [
    CsrfTokenEncryptionService,
    CsrfTokenService,
    CsrfGuard,
    CsrfTokenCleanupInterceptor,
  ],
  exports: [CsrfTokenService],
})
export class CsrfModule {}
