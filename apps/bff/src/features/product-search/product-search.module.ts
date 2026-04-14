import { Module } from '@nestjs/common'
import { ProductSearchService } from './product-search.service'
import { ProductSearchController } from './product-search.controller'
import { SEARCH_PROVIDER } from '@core/contracts/product-search/search-provider'
import { DataSourceModule } from '../../data-source/data-source.module'
import { DataSourceFactory } from '../../data-source/data-source.factory'

@Module({
  imports: [DataSourceModule],
  providers: [
    {
      provide: SEARCH_PROVIDER,
      useFactory: (dataSourceFactory: DataSourceFactory) =>
        dataSourceFactory.createSearchProvider(),
      inject: [DataSourceFactory],
    },
    ProductSearchService,
  ],
  controllers: [ProductSearchController],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
