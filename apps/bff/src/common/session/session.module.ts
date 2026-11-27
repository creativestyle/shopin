import { Global, Module } from '@nestjs/common'
import { SessionService } from './session.service'

/** The core session: identity, links, cart and wishlist ids per commerce provider, CSRF. */
@Global()
@Module({ providers: [SessionService], exports: [SessionService] })
export class SessionModule {}
