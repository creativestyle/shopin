import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk'
import { ServerClientService } from './server-client.service'

export type { ByProjectKeyRequestBuilder as Client } from '@commercetools/platform-sdk'

/** This package's own server-side commercetools client (client-credentials flow). */
export const COMMERCETOOLS_AUTH_CLIENT = 'COMMERCETOOLS_AUTH_CLIENT'

@Module({
  imports: [ConfigModule],
  providers: [
    ServerClientService,
    {
      provide: COMMERCETOOLS_AUTH_CLIENT,
      inject: [ServerClientService],
      useFactory: (
        serverClientService: ServerClientService
      ): ByProjectKeyRequestBuilder => serverClientService.getClient(),
    },
  ],
  exports: [COMMERCETOOLS_AUTH_CLIENT, ServerClientService],
})
export class CommercetoolsAuthClientModule {}
