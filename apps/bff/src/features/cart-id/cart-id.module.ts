import { Module, Global } from '@nestjs/common'
import { CartIdService } from './cart-id.service'
import { LanguageModule } from '../../common/language/language.module'
import { SessionModule } from '../../common/session/session.module'

@Global()
@Module({
  imports: [LanguageModule, SessionModule],
  providers: [CartIdService],
  exports: [CartIdService],
})
export class CartIdModule {}
