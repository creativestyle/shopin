import { Module } from '@nestjs/common'
import { NavigationService } from './navigation.service'
import { NavigationController } from './navigation.controller'

@Module({
  providers: [NavigationService],
  controllers: [NavigationController],
  exports: [NavigationService],
})
export class NavigationModule {}
