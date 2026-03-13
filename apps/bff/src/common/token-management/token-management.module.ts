import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TokenStorageService } from './token-storage.service'
import { TokenEncryptionService } from './token-encryption.service'
import { TokenProvider } from './token-provider'
import { TokenRefreshInterceptor } from './token-refresh.interceptor'
import { ACCESS_TOKEN_TOKEN } from '@config/constants'
import { StorageModule } from '../storage/storage.module'
import { DataSourceModule } from '../../data-source/data-source.module'
import { CartIdModule } from '../../features/cart-id/cart-id.module'

/**
 * Module responsible for token management:
 * - Token storage (cookies)
 * - Token encryption/decryption
 * - Token refresh
 * - Token provider (cached access to tokens)
 */
@Global()
@Module({
  imports: [ConfigModule, StorageModule, DataSourceModule, CartIdModule],
  providers: [
    TokenStorageService,
    TokenEncryptionService,
    TokenProvider,
    TokenRefreshInterceptor,
    {
      provide: ACCESS_TOKEN_TOKEN,
      useClass: TokenProvider,
    },
  ],
  exports: [
    TokenStorageService,
    TokenEncryptionService,
    TokenProvider,
    TokenRefreshInterceptor,
    ACCESS_TOKEN_TOKEN,
  ],
})
export class TokenManagementModule {}
