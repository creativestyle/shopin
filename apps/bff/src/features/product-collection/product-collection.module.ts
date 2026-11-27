import { Module } from '@nestjs/common'
import { ProductCollectionService } from './product-collection.service'
import { ProductCollectionController } from './product-collection.controller'

@Module({
  providers: [ProductCollectionService],
  controllers: [ProductCollectionController],
  exports: [ProductCollectionService],
})
export class ProductCollectionModule {}
