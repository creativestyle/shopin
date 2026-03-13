import { Module, Global } from '@nestjs/common'
import { WishlistIdService } from './wishlist-id.service'
import { WishlistKeyService } from './wishlist-key.service'
import { LanguageModule } from '../../common/language/language.module'
import { StorageModule } from '../../common/storage/storage.module'

@Global()
@Module({
  imports: [LanguageModule, StorageModule],
  providers: [WishlistKeyService, WishlistIdService],
  exports: [WishlistKeyService, WishlistIdService],
})
export class WishlistIdModule {}
