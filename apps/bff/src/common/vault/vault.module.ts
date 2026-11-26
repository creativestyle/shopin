import { Global, Module, Scope } from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import type { Request } from 'express'
import { VaultService } from './vault.service'
import { TokenEncryptionService } from '../token-management/token-encryption.service'

@Global()
@Module({
  providers: [
    {
      provide: VaultService,
      scope: Scope.REQUEST,
      inject: [REQUEST, TokenEncryptionService],
      useFactory: (req: Request, enc: TokenEncryptionService) =>
        VaultService.forRequest(req, enc),
    },
  ],
  exports: [VaultService],
})
export class VaultModule {}
