import { Module } from '@nestjs/common'
import { CustomerController } from './customer.controller'
import { CustomerService } from './customer.service'
import { DataSourceModule } from '../../data-source/data-source.module'
import { TokenManagementModule } from '../../common/token-management/token-management.module'

@Module({
  imports: [DataSourceModule, TokenManagementModule],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
