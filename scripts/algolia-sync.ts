/**
 * Sync products from commercetools to Algolia.
 *
 * Usage:
 *   npx tsx scripts/algolia-sync.ts
 *
 * Reads CT and Algolia credentials from the root .env file.
 * Fetches all published products from CT and pushes them to the Algolia index.
 * Also syncs filterable variant attributes and configures faceting.
 */

import 'dotenv/config'
import { algoliasearch } from 'algoliasearch'

const BATCH_SIZE = 100
const LANGUAGES = ['en-US', 'de-DE'] as const

// Attribute types that can be used for faceting (matches CT filterable-attributes logic)
const FACETABLE_TYPES = new Set(['ltext', 'text', 'enum', 'lenum'])

const EXCLUDED_ATTR_NAMES = new Set([
  'product-description',
  'product-list-short-description',
  'features-long-description',
  'product-spec',
  'shortDescription',
])

interface FilterableAttribute {
  name: string
  label: Record<string, string>
  fieldType: 'ltext' | 'text' | 'enum' | 'lenum'
}

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

// ---- filterable attributes ----
async function fetchFilterableAttributes(
  token: string
): Promise<FilterableAttribute[]> {
  const url = `${CT_API_URL}/${CT_PROJECT_KEY}/product-types?limit=100`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = (await response.json()) as {
    results: Array<{
      attributes?: Array<{
        name: string
        label: Record<string, string>
        isSearchable: boolean
        type: { name: string }
      }>
    }>
  }

  const seen = new Map<string, FilterableAttribute>()
  for (const pt of data.results) {
    for (const attr of pt.attributes ?? []) {
      if (seen.has(attr.name)) continue
      if (!attr.isSearchable) continue
      if (!FACETABLE_TYPES.has(attr.type.name)) continue
      if (EXCLUDED_ATTR_NAMES.has(attr.name)) continue
      seen.set(attr.name, {
        name: attr.name,
        label: attr.label,
        fieldType: attr.type.name as FilterableAttribute['fieldType'],
      })
    }
  }
  return Array.from(seen.values())
}

function extractVariantAttributes(
  variants: Record<string, any>[],
  filterableAttributes: FilterableAttribute[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const attr of filterableAttributes) {
    const isEnum = attr.fieldType === 'enum' || attr.fieldType === 'lenum'
    const isLocalizedText = attr.fieldType === 'ltext'

    if (isLocalizedText) {
      // ltext: store per-language to avoid mixing German/English values
      for (const lang of LANGUAGES) {
        const langKey = lang.replace('-', '_')
        const values = new Set<string>()
        for (const variant of variants) {
          const attrValue = variant.attributes?.find(
            (a: any) => a.name === attr.name
          )?.value
          if (attrValue == null) continue
          const langVal = attrValue[lang]
          if (langVal) values.add(String(langVal))
        }
        if (values.size > 0) {
          result[`attr_${attr.name}_${langKey}`] = Array.from(values)
        }
      }
    } else {
      const values = new Set<string>()
      for (const variant of variants) {
        const attrValue = variant.attributes?.find(
          (a: any) => a.name === attr.name
        )?.value
        if (attrValue == null) continue

        if (isEnum) {
          // enum/lenum value is { key: string, label: string | Record<string,string> }
          if (typeof attrValue === 'object' && attrValue.key) {
            values.add(String(attrValue.key))
          }
        } else {
          // text
          values.add(String(attrValue))
        }
      }
      if (values.size > 0) {
        result[`attr_${attr.name}`] = Array.from(values)
      }
    }
  }

  return result
}

// ---- mapping ----
function mapToAlgoliaRecord(
  product: Record<string, any>,
  filterableAttributes: FilterableAttribute[]
) {
  const masterVariant = product.masterVariant
  const allVariants = [masterVariant, ...(product.variants || [])]
  const image = masterVariant?.images?.[0]
  const variantCount = allVariants.length

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

  // Extract filterable variant attributes
  const attrFields = extractVariantAttributes(allVariants, filterableAttributes)
  Object.assign(record, attrFields)

  return record
}

// ---- main ----
async function main() {
  console.log('Authenticating with commercetools...')
  const token = await getCtToken()

  console.log('Fetching filterable attributes from product types...')
  const filterableAttributes = await fetchFilterableAttributes(token)
  console.log(
    `  Found ${filterableAttributes.length} filterable attributes:`,
    filterableAttributes.map((a) => a.name).join(', ')
  )

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
      allRecords.push(mapToAlgoliaRecord(product, filterableAttributes))
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

  // Build attributesForFaceting from filterable attributes + price fields
  // Variant attributes need full faceting (counts), price fields need filtering only
  // ltext attributes get per-language entries; enum/text are language-independent
  const facetAttributes: string[] = []
  for (const a of filterableAttributes) {
    if (a.fieldType === 'ltext') {
      for (const lang of LANGUAGES) {
        facetAttributes.push(`attr_${a.name}_${lang.replace('-', '_')}`)
      }
    } else {
      facetAttributes.push(`attr_${a.name}`)
    }
  }
  for (const lang of LANGUAGES) {
    const prefix = `price_${lang.replace('-', '_')}`
    facetAttributes.push(`filterOnly(${prefix}_centAmount)`)
    facetAttributes.push(`filterOnly(${prefix}_discountedCentAmount)`)
  }

  // Store attribute metadata as userData so the search service can read labels
  const attributeMetadata = filterableAttributes.map((a) => ({
    name: a.name,
    label: a.label,
    fieldType: a.fieldType,
  }))

  console.log('\nConfiguring index settings...')
  await algoliaClient.setSettings({
    indexName: ALGOLIA_INDEX_NAME,
    indexSettings: {
      searchableAttributes: ['name_en_US', 'name_de_DE'],
      typoTolerance: false,
      attributesForFaceting: facetAttributes,
      userData: { filterableAttributes: attributeMetadata },
    },
  })
  console.log('Index settings updated.')
  console.log(
    '  attributesForFaceting:',
    facetAttributes.join(', ')
  )
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
