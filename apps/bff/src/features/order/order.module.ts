import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { TokenManagementModule } from '../../common/token-management/token-management.module'
import { CartIdModule } from '../cart-id/cart-id.module'

@Module({
  imports: [TokenManagementModule, CartIdModule],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
