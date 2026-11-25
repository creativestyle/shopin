import { Module } from '@nestjs/common'
import {
  CommercetoolsCoreModule,
  ServerClientService,
  type Client,
} from '@integrations/commercetools-core'
import { UserClientService } from './user-client.service'

export const COMMERCETOOLS_CLIENT = 'COMMERCETOOLS_CLIENT'

@Module({
  imports: [CommercetoolsCoreModule],
  providers: [
    {
      provide: COMMERCETOOLS_CLIENT,
      inject: [ServerClientService],
      useFactory: (serverClientService: ServerClientService): Client => {
        return serverClientService.getClient()
      },
    },
    UserClientService,
  ],
  exports: [
    COMMERCETOOLS_CLIENT,
    UserClientService, // Export so services can inject it directly for lazy client creation
    CommercetoolsCoreModule, // Exports ServerClientService for server-scoped operations
  ],
})
export class CommercetoolsClientModule {}
