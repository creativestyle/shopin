import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CommercetoolsClientModule } from './client/client.module'
import * as services from './services'
import { CommercetoolsServiceProviderImpl } from './commercetools-service-provider'

@Global()
@Module({
  imports: [ConfigModule, CommercetoolsClientModule],
  providers: [
    ...Object.values(services),
    {
      provide: 'COMMERCETOOLS_SERVICE_PROVIDER',
      useClass: CommercetoolsServiceProviderImpl,
    },
  ],
  exports: [
    CommercetoolsClientModule,
    ...Object.values(services),
    'COMMERCETOOLS_SERVICE_PROVIDER',
  ],
})
export class CommercetoolsApiModule {}
