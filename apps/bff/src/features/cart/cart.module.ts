import { Module, Global } from '@nestjs/common'
import { CartService } from './cart.service'
import { CartController } from './cart.controller'
import { CartTokenRefreshInterceptor } from './cart-token-refresh.interceptor'
import { DataSourceModule } from '../../data-source/data-source.module'
import { LanguageModule } from '../../common/language/language.module'
import { TokenManagementModule } from '../../common/token-management/token-management.module'
import { CartIdModule } from '../cart-id/cart-id.module'

@Global()
@Module({
  imports: [
    DataSourceModule,
    LanguageModule,
    TokenManagementModule,
    CartIdModule,
  ],
  providers: [CartService, CartTokenRefreshInterceptor],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
