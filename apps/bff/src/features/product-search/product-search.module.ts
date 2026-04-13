import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ProductSearchService } from './product-search.service'
import { ProductSearchController } from './product-search.controller'
import { AlgoliaSearchService } from './algolia-search.service'
import { CtSearchAdapter } from './ct-search.adapter'
import { SEARCH_PROVIDER } from './search-provider.interface'
import { DataSourceModule } from '../../data-source/data-source.module'
import { DataSourceFactory } from '../../data-source/data-source.factory'

function shouldUseAlgolia(configService: ConfigService): boolean {
  const provider = configService.get<string>('SEARCH_PROVIDER')
  if (provider === 'algolia') {
    return true
  }
  if (provider === 'commercetools') {
    return false
  }
  return !!configService.get<string>('ALGOLIA_APP_ID')
}

@Module({
  imports: [DataSourceModule, ConfigModule],
  providers: [
    {
      provide: SEARCH_PROVIDER,
      useFactory: (
        configService: ConfigService,
        dataSourceFactory: DataSourceFactory
      ) => {
        if (shouldUseAlgolia(configService)) {
          const service = new AlgoliaSearchService(configService)
          service.onModuleInit()
          return service
        }
        return new CtSearchAdapter(dataSourceFactory)
      },
      inject: [ConfigService, DataSourceFactory],
    },
    ProductSearchService,
  ],
  controllers: [ProductSearchController],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
