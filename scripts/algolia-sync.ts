/**
 * Sync products from commercetools to Algolia.
 *
 * Usage:
 *   npx tsx scripts/algolia-sync.ts
 *
 * Reads CT and Algolia credentials from the root .env file.
 * Fetches all published products from CT and pushes them to the Algolia index.
 */

import 'dotenv/config'
import { algoliasearch } from 'algoliasearch'

const BATCH_SIZE = 100
const LANGUAGES = ['en-US', 'de-DE'] as const

// ---- env validation ----
function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing env var: ${key}`)
  return val
}

const CT_PROJECT_KEY = requireEnv('COMMERCETOOLS_PROJECT_KEY')
const CT_CLIENT_ID = requireEnv('COMMERCETOOLS_CLIENT_ID')
const CT_CLIENT_SECRET = requireEnv('COMMERCETOOLS_CLIENT_SECRET')
const CT_AUTH_URL = requireEnv('COMMERCETOOLS_AUTH_URL')
const CT_API_URL = requireEnv('COMMERCETOOLS_API_URL')

const ALGOLIA_APP_ID = requireEnv('ALGOLIA_APP_ID')
const ALGOLIA_WRITE_API_KEY = requireEnv('ALGOLIA_WRITE_API_KEY')
const ALGOLIA_INDEX_NAME = requireEnv('ALGOLIA_INDEX_NAME')

// ---- CT auth ----
async function getCtToken(): Promise<string> {
  const response = await fetch(`${CT_AUTH_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${CT_CLIENT_ID}:${CT_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

// ---- Algolia client ----
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY)

// ---- mapping ----
function mapToAlgoliaRecord(product: Record<string, any>) {
  const masterVariant = product.masterVariant
  const image = masterVariant?.images?.[0]
  const variantCount = 1 + (product.variants?.length || 0)

  const record: Record<string, unknown> = {
    objectID: product.id,
    slug: product.slug,
    variantId: String(masterVariant?.id ?? 1),
    variantCount,
    imageUrl: image?.url || '/images/product-image.png',
    imageAlt: image?.label || 'Product image',
  }

  for (const lang of LANGUAGES) {
    const name = product.name?.[lang]
    if (name) record[`name_${lang.replace('-', '_')}`] = name
  }

  if (product.description) {
    for (const lang of LANGUAGES) {
      const desc = product.description[lang]
      if (desc) record[`description_${lang.replace('-', '_')}`] = desc
    }
  }

  if (product.categories?.length) {
    record.categoryIds = product.categories.map((c: any) => c.id)
  }

  // Map prices per country (US, DE) for language-aware price selection
  const prices = masterVariant?.prices ?? []
  for (const lang of LANGUAGES) {
    const country = lang.split('-')[1] // 'US' or 'DE'
    const prefix = `price_${lang.replace('-', '_')}`
    const selectedPrice =
      prices.find((p: any) => p.country === country) ?? prices[0]

    if (selectedPrice) {
      record[`${prefix}_centAmount`] = selectedPrice.value.centAmount
      record[`${prefix}_currency`] = selectedPrice.value.currencyCode
      record[`${prefix}_fractionDigits`] =
        selectedPrice.value.fractionDigits ?? 2

      if (selectedPrice.discounted?.value?.centAmount != null) {
        record[`${prefix}_discountedCentAmount`] =
          selectedPrice.discounted.value.centAmount
      }

      const fields = selectedPrice.custom?.fields
      if (fields?.recommendedRetailPrice != null) {
        record[`${prefix}_rrpCentAmount`] = fields.recommendedRetailPrice
      }
      if (fields?.omnibusPrice != null) {
        record[`${prefix}_omnibusCentAmount`] = fields.omnibusPrice
      }
    }
  }

  return record
}

// ---- main ----
async function main() {
  console.log('Authenticating with commercetools...')
  const token = await getCtToken()

  console.log('Fetching products from commercetools...')

  let offset = 0
  let total = Infinity
  const allRecords: Record<string, unknown>[] = []

  while (offset < total) {
    const url = `${CT_API_URL}/${CT_PROJECT_KEY}/product-projections/search?limit=${BATCH_SIZE}&offset=${offset}&staged=false`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = (await response.json()) as {
      total?: number
      results: Record<string, any>[]
    }

    total = data.total ?? data.results.length
    for (const product of data.results) {
      allRecords.push(mapToAlgoliaRecord(product))
    }

    offset += data.results.length
    console.log(`  Fetched ${offset}/${total} products`)
  }

  console.log(
    `\nPushing ${allRecords.length} records to Algolia index "${ALGOLIA_INDEX_NAME}"...`
  )

  const result = await algoliaClient.saveObjects({
    indexName: ALGOLIA_INDEX_NAME,
    objects: allRecords,
  })

  console.log(`Done! Pushed ${allRecords.length} records.`, result)

  console.log('\nConfiguring index settings...')
  await algoliaClient.setSettings({
    indexName: ALGOLIA_INDEX_NAME,
    indexSettings: {
      searchableAttributes: ['name_en_US', 'name_de_DE'],
      typoTolerance: false,
    },
  })
  console.log('Index settings updated.')
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
