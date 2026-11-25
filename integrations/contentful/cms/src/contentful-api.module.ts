import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GraphQLClientModule } from './client'
import * as services from './services'
import { ContentfulServiceProviderImpl } from './contentful-service-provider'

@Global()
@Module({
  imports: [ConfigModule, GraphQLClientModule],
  providers: [
    ...Object.values(services),
    {
      provide: 'CONTENTFUL_SERVICE_PROVIDER',
      useClass: ContentfulServiceProviderImpl,
    },
  ],
  exports: [...Object.values(services), 'CONTENTFUL_SERVICE_PROVIDER'],
})
export class ContentfulApiModule {}
