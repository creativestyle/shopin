import { Module, Global } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { DataSourceModule } from '../../data-source/data-source.module'
import { TokenManagementModule } from '../../common/token-management/token-management.module'
import { CartIdModule } from '../cart-id/cart-id.module'
import { CustomerModule } from '../customer/customer.module'
import { CommercetoolsApiModule } from '@integrations/commercetools-api'
import { WishlistModule } from '../wishlist/wishlist.module'
import { WishlistIdModule } from '../wishlist-id/wishlist-id.module'

@Global()
@Module({
  imports: [
    DataSourceModule,
    TokenManagementModule,
    CartIdModule,
    CustomerModule,
    CommercetoolsApiModule,
    WishlistModule,
    WishlistIdModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
