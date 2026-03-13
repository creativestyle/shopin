import { Module } from '@nestjs/common'
import { NavigationService } from './navigation.service'
import { NavigationController } from './navigation.controller'
import { DataSourceModule } from '../../data-source/data-source.module'

@Module({
  imports: [DataSourceModule],
  providers: [NavigationService],
  controllers: [NavigationController],
  exports: [NavigationService],
})
export class NavigationModule {}
