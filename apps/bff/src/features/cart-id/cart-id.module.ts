import { Module, Global } from '@nestjs/common'
import { CartIdService } from './cart-id.service'
import { CartKeyService } from './cart-key.service'
import { LanguageModule } from '../../common/language/language.module'
import { StorageModule } from '../../common/storage/storage.module'

@Global()
@Module({
  imports: [LanguageModule, StorageModule],
  providers: [CartKeyService, CartIdService],
  exports: [CartKeyService, CartIdService],
})
export class CartIdModule {}
