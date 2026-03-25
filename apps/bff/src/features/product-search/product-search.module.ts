import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ProductSearchService } from './product-search.service'
import { ProductSearchController } from './product-search.controller'
import { AlgoliaSearchService } from './algolia-search.service'
import { CtSearchAdapter } from './ct-search.adapter'
import { SEARCH_PROVIDER } from './search-provider.interface'
import { DataSourceModule } from '../../data-source/data-source.module'

@Module({
  imports: [DataSourceModule, ConfigModule],
  providers: [
    AlgoliaSearchService,
    CtSearchAdapter,
    {
      provide: SEARCH_PROVIDER,
      useFactory: (
        configService: ConfigService,
        algolia: AlgoliaSearchService,
        ct: CtSearchAdapter
      ) => {
        const provider = configService.get<string>('SEARCH_PROVIDER')
        if (provider === 'commercetools') return ct
        if (provider === 'algolia') return algolia

        // Auto-detect: use Algolia if keys are present, otherwise CT
        const algoliaAppId = configService.get<string>('ALGOLIA_APP_ID')
        return algoliaAppId ? algolia : ct
      },
      inject: [ConfigService, AlgoliaSearchService, CtSearchAdapter],
    },
    ProductSearchService,
  ],
  controllers: [ProductSearchController],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
