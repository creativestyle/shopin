import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk'
import { ClientBuilder } from '@commercetools/ts-client'
import type { Client } from './client'

/**
 * A commercetools client that acts with an access token the caller already has (a customer's or an anonymous
 * session's), sent as is: no token is fetched or refreshed here.
 */
export function createTokenClient({
  accessToken,
  apiUrl,
  projectKey,
}: {
  accessToken: string | undefined
  apiUrl: string
  projectKey: string
}): Client {
  const client = new ClientBuilder()
    .withExistingTokenFlow(`Bearer ${accessToken}`, { force: true })
    .withHttpMiddleware({ host: apiUrl })
    .build()
  return createApiBuilderFromCtpClient(client).withProjectKey({ projectKey })
}
