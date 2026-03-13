import { Module } from '@nestjs/common'
import { StoreConfigController } from './store-config.controller'
import { StoreConfigService } from './store-config.service'

@Module({
  controllers: [StoreConfigController],
  providers: [StoreConfigService],
  exports: [StoreConfigService],
})
export class StoreConfigModule {}
