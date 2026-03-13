import { Module } from '@nestjs/common'
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk'
import { ServerClientService } from './server-client.service'
import { UserClientService } from './user-client.service'

export type { ByProjectKeyRequestBuilder as Client } from '@commercetools/platform-sdk'

export const COMMERCETOOLS_CLIENT = 'COMMERCETOOLS_CLIENT'

@Module({
  providers: [
    ServerClientService,
    {
      provide: COMMERCETOOLS_CLIENT,
      inject: [ServerClientService],
      useFactory: (
        serverClientService: ServerClientService
      ): ByProjectKeyRequestBuilder => {
        return serverClientService.getClient()
      },
    },
    UserClientService,
  ],
  exports: [
    COMMERCETOOLS_CLIENT,
    UserClientService, // Export so services can inject it directly for lazy client creation
    ServerClientService, // Export so services can inject it for server-scoped operations
  ],
})
export class CommercetoolsClientModule {}
