import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CommercetoolsApiModule } from '@integrations/commercetools-api'
import * as services from './services'
import { CommercetoolsErrorMatcher } from './utils/commercetools-error-matcher'
import { CommercetoolsAuthServiceProviderImpl } from './commercetools-auth-service-provider'

@Module({
  imports: [ConfigModule, CommercetoolsApiModule],
  providers: [
    CommercetoolsErrorMatcher,
    ...Object.values(services),
    {
      provide: 'COMMERCETOOLS_AUTH_SERVICE_PROVIDER',
      useClass: CommercetoolsAuthServiceProviderImpl,
    },
  ],
  exports: [...Object.values(services), 'COMMERCETOOLS_AUTH_SERVICE_PROVIDER'],
})
export class CommercetoolsAuthModule {}
