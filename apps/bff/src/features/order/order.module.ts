import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { DataSourceModule } from '../../data-source/data-source.module'
import { TokenManagementModule } from '../../common/token-management/token-management.module'
import { CartIdModule } from '../cart-id/cart-id.module'

@Module({
  imports: [DataSourceModule, TokenManagementModule, CartIdModule],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
