import { Module, Global } from '@nestjs/common'
import { WishlistService } from './wishlist.service'
import { WishlistController } from './wishlist.controller'
import { LanguageModule } from '../../common/language/language.module'
import { TokenManagementModule } from '../../common/token-management/token-management.module'
import { WishlistIdModule } from '../wishlist-id/wishlist-id.module'

@Global()
@Module({
  imports: [LanguageModule, TokenManagementModule, WishlistIdModule],
  providers: [WishlistService],
  controllers: [WishlistController],
  exports: [WishlistService],
})
export class WishlistModule {}
