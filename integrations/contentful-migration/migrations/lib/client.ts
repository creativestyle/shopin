/**
 * Contentful Management API plain client for migrations.
 * Uses env: CONTENTFUL_SPACE, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_ACCESS_TOKEN.
 * Accepts migration from runner so it's clear this is called from run(migration).
 */
import * as contentfulManagement from 'contentful-management'
import type { PlainClientAPI } from 'contentful-management'

let cachedClient: PlainClientAPI | null = null

function isPlainClient(client: unknown): client is PlainClientAPI {
  return (
    client != null &&
    typeof client === 'object' &&
    'entry' in client &&
    'asset' in client &&
    'contentType' in client
  )
}

export function getManagementClient(migration: unknown): PlainClientAPI {
  if (cachedClient) {
    return cachedClient
  }
  if (migration === undefined) {
    throw new Error(
      'getManagementClient must be called from migration run(migration)'
    )
  }
  const spaceId = process.env.CONTENTFUL_SPACE
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN
  if (!spaceId || !environmentId || !accessToken) {
    throw new Error(
      'Missing env: CONTENTFUL_SPACE, CONTENTFUL_ENVIRONMENT, CONTENTFUL_MANAGEMENT_ACCESS_TOKEN. ' +
        'Load .env when running migrations (e.g. dotenv -e ../../.env).'
    )
  }
  const client = contentfulManagement.createClient(
    { accessToken },
    {
      type: 'plain',
      defaults: { spaceId, environmentId },
    }
  )
  if (!isPlainClient(client)) {
    throw new Error('Expected contentful-management plain client')
  }
  cachedClient = client
  return client
}
