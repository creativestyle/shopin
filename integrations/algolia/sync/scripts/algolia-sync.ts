#!/usr/bin/env node
/**
 * Sync products from commercetools to Algolia.
 *
 * Usage: npm run sync -- [options]
 *
 * Reads CT and Algolia credentials from the root .env file.
 * Fetches all published products from CT and pushes them to the Algolia index.
 * Also syncs filterable variant attributes and configures faceting.
 */
import { Command } from 'commander'
import { algoliasearch } from 'algoliasearch'
import type {
  ProductProjectionPagedSearchResponse,
  ProductTypePagedQueryResponse,
} from '@commercetools/platform-sdk'
import { PRODUCT_TYPES_FETCH_LIMIT } from '@config/constants'
import {
  buildFacetAttributes,
  mapToAlgoliaRecord,
  replicaRankings,
  selectFilterableAttributes,
  virtualReplicas,
  type FilterableAttribute,
} from './lib/transform'

const BATCH_SIZE = 100

// ---- env validation ----
function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    throw new Error(`Missing env var: ${key}`)
  }
  return val
}

// ---- HTTP error checking ----
async function fetchJson<T>(
  url: string,
  // eslint-disable-next-line no-undef
  init?: RequestInit,
  description?: string
): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `HTTP ${response.status} ${response.statusText}` +
        (description ? ` (${description})` : '') +
        (body ? `\n${body}` : '')
    )
  }
  return response.json() as Promise<T>
}

// ---- CT auth ----
interface CtAuth {
  token: string
  expiresAt: number
}

async function authenticate(
  authUrl: string,
  clientId: string,
  clientSecret: string
): Promise<CtAuth> {
  const data = await fetchJson<{ access_token: string; expires_in: number }>(
    `${authUrl}/oauth/token`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    },
    'CT auth'
  )
  // Refresh 60s before actual expiry to avoid mid-request failures
  const expiresAt = Date.now() + (data.expires_in - 60) * 1000
  return { token: data.access_token, expiresAt }
}

async function getToken(
  auth: CtAuth,
  authUrl: string,
  clientId: string,
  clientSecret: string
): Promise<CtAuth> {
  if (Date.now() < auth.expiresAt) {
    return auth
  }
  console.log('  Token expired, refreshing...')
  return authenticate(authUrl, clientId, clientSecret)
}

// ---- filterable attributes ----
async function fetchFilterableAttributes(
  apiUrl: string,
  projectKey: string,
  auth: CtAuth
): Promise<FilterableAttribute[]> {
  const data = await fetchJson<ProductTypePagedQueryResponse>(
    `${apiUrl}/${projectKey}/product-types?limit=${PRODUCT_TYPES_FETCH_LIMIT}`,
    { headers: { Authorization: `Bearer ${auth.token}` } },
    'fetch product types'
  )

  return selectFilterableAttributes(data.results)
}

// ---- CLI ----
const program = new Command()

program
  .name('algolia-sync')
  .description('Sync products from commercetools to Algolia')
  .option('--dry-run', 'Fetch and map products without pushing to Algolia')
  .action(async (opts: { dryRun?: boolean }) => {
    const ctProjectKey = requireEnv('COMMERCETOOLS_PROJECT_KEY')
    const ctClientId = requireEnv('COMMERCETOOLS_CLIENT_ID')
    const ctClientSecret = requireEnv('COMMERCETOOLS_CLIENT_SECRET')
    const ctAuthUrl = requireEnv('COMMERCETOOLS_AUTH_URL')
    const ctApiUrl = requireEnv('COMMERCETOOLS_API_URL')
    const algoliaAppId = requireEnv('ALGOLIA_APP_ID')
    const algoliaWriteApiKey = requireEnv('ALGOLIA_WRITE_API_KEY')
    const algoliaIndexName = requireEnv('ALGOLIA_INDEX_NAME')

    console.log('Authenticating with commercetools...')
    let auth = await authenticate(ctAuthUrl, ctClientId, ctClientSecret)

    console.log('Fetching filterable attributes from product types...')
    const filterableAttributes = await fetchFilterableAttributes(
      ctApiUrl,
      ctProjectKey,
      auth
    )
    console.log(
      `  Found ${filterableAttributes.length} filterable attributes:`,
      filterableAttributes.map((a) => a.name).join(', ')
    )

    console.log('Fetching products from commercetools...')

    let offset = 0
    let total = Infinity
    const allRecords: Record<string, unknown>[] = []

    while (offset < total) {
      auth = await getToken(auth, ctAuthUrl, ctClientId, ctClientSecret)
      const url = `${ctApiUrl}/${ctProjectKey}/product-projections/search?limit=${BATCH_SIZE}&offset=${offset}&staged=false`
      const data = await fetchJson<ProductProjectionPagedSearchResponse>(
        url,
        { headers: { Authorization: `Bearer ${auth.token}` } },
        `fetch products offset=${offset}`
      )

      total = data.total ?? data.results.length
      for (const product of data.results) {
        allRecords.push(mapToAlgoliaRecord(product, filterableAttributes))
      }

      offset += data.results.length
      console.log(`  Fetched ${offset}/${total} products`)
    }

    if (opts.dryRun) {
      console.log(
        `\nDry run: ${allRecords.length} records mapped, skipping Algolia push.`
      )
      return
    }

    const algoliaClient = algoliasearch(algoliaAppId, algoliaWriteApiKey)

    console.log(
      `\nPushing ${allRecords.length} records to Algolia index "${algoliaIndexName}"...`
    )

    const result = await algoliaClient.replaceAllObjects({
      indexName: algoliaIndexName,
      objects: allRecords,
    })

    console.log(
      `Done! Index replaced with ${allRecords.length} records.`,
      result
    )

    const facetAttributes = buildFacetAttributes(filterableAttributes)

    const attributeMetadata = filterableAttributes.map((a) => ({
      name: a.name,
      label: a.label,
      fieldType: a.fieldType,
    }))

    const replicas = virtualReplicas(algoliaIndexName)

    console.log('\nConfiguring index settings...')
    await algoliaClient.setSettings({
      indexName: algoliaIndexName,
      indexSettings: {
        searchableAttributes: ['name_en_US', 'name_de_DE'],
        typoTolerance: false,
        attributesForFaceting: facetAttributes,
        userData: { filterableAttributes: attributeMetadata },
        replicas,
      },
    })
    console.log('Index settings updated.')
    console.log('  attributesForFaceting:', facetAttributes.join(', '))
    console.log('  replicas:', replicas.join(', '))

    // Configure each virtual replica with its custom ranking
    for (const { indexName, ranking } of replicaRankings(algoliaIndexName)) {
      await algoliaClient.setSettings({
        indexName,
        indexSettings: { customRanking: ranking },
      })
      console.log(`  Configured replica: ${indexName}`)
    }
  })

program.parse()
