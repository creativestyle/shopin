import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'
import { ClientBuilder } from '@commercetools/ts-client'
import type { Client } from './client.module'

@Injectable()
export class ServerClientService {
  private readonly clientInstance: Client

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_CLIENT_ID'
    )
    const clientSecret = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_CLIENT_SECRET'
    )
    const projectKey = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_PROJECT_KEY'
    )
    const apiUrl = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_API_URL'
    )
    const authUrl = this.configService.getOrThrow<string>(
      'COMMERCETOOLS_AUTH_URL'
    )

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
