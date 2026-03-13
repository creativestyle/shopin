import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ContentService } from './content.service'
import { ContentController } from './content.controller'
import { DraftModeService } from './draft-mode.service'
import { DataSourceModule } from '../../data-source/data-source.module'
import { LanguageModule } from '../../common/language/language.module'
import { ProductCollectionModule } from '../product-collection/product-collection.module'

@Module({
  imports: [
    ConfigModule,
    DataSourceModule,
    LanguageModule,
    ProductCollectionModule,
  ],
  providers: [ContentService, DraftModeService],
  controllers: [ContentController],
  exports: [ContentService],
})
export class ContentModule {}
