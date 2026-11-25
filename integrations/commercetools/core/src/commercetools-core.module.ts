import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ServerClientService } from './server-client.service'

/**
 * What the commercetools parts share: one server-side client (client-credentials flow). Every part imports this
 * module, so they all get the same ServerClientService instance and one token.
 */
@Module({
  imports: [ConfigModule],
  providers: [ServerClientService],
  exports: [ServerClientService],
})
export class CommercetoolsCoreModule {}
