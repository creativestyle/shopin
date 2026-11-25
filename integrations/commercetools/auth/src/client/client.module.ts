import { Module } from '@nestjs/common'
import {
  CommercetoolsCoreModule,
  ServerClientService,
  type Client,
} from '@integrations/commercetools-core'

/** The shared server-side commercetools client (client-credentials flow), for the auth services. */
export const COMMERCETOOLS_AUTH_CLIENT = 'COMMERCETOOLS_AUTH_CLIENT'

@Module({
  imports: [CommercetoolsCoreModule],
  providers: [
    {
      provide: COMMERCETOOLS_AUTH_CLIENT,
      inject: [ServerClientService],
      useFactory: (serverClientService: ServerClientService): Client =>
        serverClientService.getClient(),
    },
  ],
  exports: [COMMERCETOOLS_AUTH_CLIENT, CommercetoolsCoreModule],
})
export class CommercetoolsAuthClientModule {}
