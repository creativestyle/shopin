import type { Provider } from '@nestjs/common'
import type { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk'
import { ServerClientService } from '../server-client.service'
import { UserClientService } from './user-client.service'

export type { ByProjectKeyRequestBuilder as Client } from '@commercetools/platform-sdk'

export const COMMERCETOOLS_CLIENT = 'COMMERCETOOLS_CLIENT'

/**
 * The package-internal API client, shared by the commerce, search and auth parts. Each part lists these
 * providers in its own module, so the client is built from that part's PortOptions and TokenVault.
 */
export const clientProviders: Provider[] = [
  ServerClientService,
  {
    provide: COMMERCETOOLS_CLIENT,
    inject: [ServerClientService],
    useFactory: (s: ServerClientService): ByProjectKeyRequestBuilder =>
      s.getClient(),
  },
  UserClientService,
]
