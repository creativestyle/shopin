import { Module } from '@nestjs/common'
import { ProductCollectionService } from './product-collection.service'
import { ProductCollectionController } from './product-collection.controller'
import { DataSourceModule } from '../../data-source/data-source.module'

@Module({
  imports: [DataSourceModule],
  providers: [ProductCollectionService],
  controllers: [ProductCollectionController],
  exports: [ProductCollectionService],
})
export class ProductCollectionModule {}
