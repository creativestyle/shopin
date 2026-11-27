import { Inject, Injectable } from '@nestjs/common'
import { PortOptions } from '@core/integration-kit'
import type { CommercetoolsOptions } from './env'
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'
import { ClientBuilder } from '@commercetools/ts-client'
import type { Client } from './client/client.module'

@Injectable()
export class ServerClientService {
  private readonly clientInstance: Client

  constructor(@Inject(PortOptions) options: CommercetoolsOptions) {
    const clientId = options.clientId
    const clientSecret = options.clientSecret
    const projectKey = options.projectKey
    const apiUrl = options.apiUrl
    const authUrl = options.authUrl

    const client = new ClientBuilder()
      .withClientCredentialsFlow({
        credentials: {
          clientId,
          clientSecret,
        },
        projectKey,
        host: authUrl,
      })
      .withHttpMiddleware({
        host: apiUrl,
      })
      .build()

    this.clientInstance = createApiBuilderFromCtpClient(client).withProjectKey({
      projectKey,
    })
  }

  getClient(): Client {
    return this.clientInstance
  }
}
