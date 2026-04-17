import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AlgoliaClientModule } from './client/algolia-client.module'
import { AlgoliaServiceProviderImpl } from './algolia-service-provider'

@Global()
@Module({
  imports: [ConfigModule, AlgoliaClientModule],
  providers: [
    {
      provide: 'ALGOLIA_SERVICE_PROVIDER',
      useClass: AlgoliaServiceProviderImpl,
    },
  ],
  exports: [AlgoliaClientModule, 'ALGOLIA_SERVICE_PROVIDER'],
})
export class AlgoliaApiModule {}
