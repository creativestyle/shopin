import { Injectable, Inject } from '@nestjs/common'
import { PortOptions } from '@core/integration-kit'
import type { CommercetoolsOptions } from '../env'
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'
import { ClientBuilder } from '@commercetools/ts-client'
import { TokenVault } from '@core/integration-kit'
import type { Client } from './client.module'

@Injectable()
export class UserClientService {
  constructor(
    @Inject(PortOptions) private readonly options: CommercetoolsOptions,
    private readonly vault: TokenVault
  ) {}

  /** A client acting with this part's vault entry for the shopper of the request in progress. */
  async getClient(): Promise<Client> {
    return this.forToken((await this.vault.get())?.accessToken)
  }

  /** A client acting with one given access token (e.g. the customer token a sign-in just returned). */
  forToken(accessToken: string | undefined): Client {
    const client = new ClientBuilder()
      .withExistingTokenFlow(`Bearer ${accessToken}`, { force: true })
      .withHttpMiddleware({ host: this.options.apiUrl })
      .build()
    return createApiBuilderFromCtpClient(client).withProjectKey({
      projectKey: this.options.projectKey,
    })
  }
}
