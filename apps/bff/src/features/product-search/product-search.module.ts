import { Module } from '@nestjs/common'
import { ProductSearchService } from './product-search.service'
import { ProductSearchController } from './product-search.controller'
import { DataSourceModule } from '../../data-source/data-source.module'

@Module({
  imports: [DataSourceModule],
  providers: [ProductSearchService],
  controllers: [ProductSearchController],
  exports: [ProductSearchService],
})
export class ProductSearchModule {}
