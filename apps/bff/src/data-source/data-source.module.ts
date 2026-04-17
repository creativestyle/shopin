import {
  Module,
  Global,
  Scope,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common'
import { REQUEST } from '@nestjs/core'
import { MockApiModule } from '@integrations/mock-api'
import { CommercetoolsApiModule } from '@integrations/commercetools-api'
import { CommercetoolsAuthModule } from '@integrations/commercetools-auth'
import { ContentfulApiModule } from '@integrations/contentful-api'
import { AlgoliaApiModule } from '@integrations/algolia-api'
import { DataSourceFactory } from './data-source.factory'
import { DATA_SOURCE } from './tokens'
import type { DataSource } from '@config/constants'
import { DEFAULT_DATA_SOURCE } from '@config/constants'
import {
  dataSourceHeaderMiddleware,
  type DataSourceRequest,
} from '@demo/data-source-header-reader'

@Global()
@Module({
  imports: [
    MockApiModule,
    CommercetoolsApiModule,
    CommercetoolsAuthModule,
    ContentfulApiModule,
    AlgoliaApiModule,
  ],
  providers: [
    {
      provide: DATA_SOURCE,
      scope: Scope.REQUEST,
      inject: [REQUEST],
      useFactory: (request: DataSourceRequest): DataSource => {
        return request.dataSource || DEFAULT_DATA_SOURCE
      },
    },
    DataSourceFactory,
  ],
  exports: [DATA_SOURCE, DataSourceFactory],
})
export class DataSourceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(dataSourceHeaderMiddleware).forRoutes('*')
  }
}
