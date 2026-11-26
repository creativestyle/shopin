import { Module, Global } from '@nestjs/common'
import { WishlistIdService } from './wishlist-id.service'
import { LanguageModule } from '../../common/language/language.module'
import { SessionModule } from '../../common/session/session.module'

@Global()
@Module({
  imports: [LanguageModule, SessionModule],
  providers: [WishlistIdService],
  exports: [WishlistIdService],
})
export class WishlistIdModule {}
