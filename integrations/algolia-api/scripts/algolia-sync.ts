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
  ProductProjection,
  ProductProjectionPagedSearchResponse,
  ProductVariant,
  Attribute,
  Price,
  Image,
  CategoryReference,
  ProductType,
  ProductTypePagedQueryResponse,
  AttributeDefinition,
  LocalizedString,
} from '@commercetools/platform-sdk'

import {
  PRODUCT_TYPES_FETCH_LIMIT,
  FACETABLE_TYPES,
  EXCLUDED_ATTR_NAMES,
  LOCALIZED_ATTR_TYPES,
} from '@config/constants'
import type { FacetableFieldType } from '@config/constants'

const BATCH_SIZE = 100

const LANGUAGES = ['en-US', 'de-DE'] as const

interface FilterableAttribute {
  name: string
  label: LocalizedString
  fieldType: FacetableFieldType
}

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

  const seen = new Map<string, FilterableAttribute>()
  for (const pt of data.results as ProductType[]) {
    for (const attr of (pt.attributes ?? []) as AttributeDefinition[]) {
      if (seen.has(attr.name)) {
        continue
      }
      if (!attr.isSearchable) {
        continue
      }
      if (!FACETABLE_TYPES.has(attr.type.name)) {
        continue
      }
      if (EXCLUDED_ATTR_NAMES.has(attr.name)) {
        continue
      }
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
  variants: ProductVariant[],
  filterableAttributes: FilterableAttribute[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const attr of filterableAttributes) {
    const isEnum = attr.fieldType === 'enum' || attr.fieldType === 'lenum'
    const isLocalizedText = LOCALIZED_ATTR_TYPES.has(attr.fieldType)
    const isLocalizedEnum = attr.fieldType === 'lenum'

    if (isLocalizedText) {
      for (const lang of LANGUAGES) {
        const langKey = lang.replace('-', '_')
        const values = new Set<string>()
        for (const variant of variants) {
          const found: Attribute | undefined = variant.attributes?.find(
            (a: Attribute) => a.name === attr.name
          )
          if (found?.value == null) {
            continue
          }
          const localized = isLocalizedEnum
            ? (found.value as { label: LocalizedString }).label
            : (found.value as LocalizedString)
          const langVal = localized?.[lang]
          if (langVal) {
            values.add(String(langVal))
          }
        }
        if (values.size > 0) {
          result[`attr_${attr.name}_${langKey}`] = Array.from(values)
        }
      }
    } else {
      const values = new Set<string>()
      for (const variant of variants) {
        const found: Attribute | undefined = variant.attributes?.find(
          (a: Attribute) => a.name === attr.name
        )
        if (found?.value == null) {
          continue
        }

        if (isEnum) {
          const enumValue = found.value as { key?: string }
          if (enumValue.key) {
            values.add(String(enumValue.key))
          }
        } else {
          values.add(String(found.value))
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
  product: ProductProjection,
  filterableAttributes: FilterableAttribute[]
): Record<string, unknown> {
  const masterVariant: ProductVariant = product.masterVariant
  const allVariants: ProductVariant[] = [
    masterVariant,
    ...(product.variants ?? []),
  ]
  const image: Image | undefined = masterVariant.images?.[0]
  const variantCount = allVariants.length

  const record: Record<string, unknown> = {
    objectID: product.id,
    slug: product.slug,
    variantId: String(masterVariant.id ?? 1),
    variantCount,
    imageUrl: image?.url || '/images/product-image.png',
    imageAlt: image?.label || 'Product image',
    createdAt: product.createdAt
      ? new Date(product.createdAt).getTime()
      : undefined,
  }

  for (const lang of LANGUAGES) {
    const name = product.name[lang]
    if (name) {
      record[`name_${lang.replace('-', '_')}`] = name
    }
  }

  if (product.description) {
    for (const lang of LANGUAGES) {
      const desc = product.description[lang]
      if (desc) {
        record[`description_${lang.replace('-', '_')}`] = desc
      }
    }
  }

  const categories = product.categories as CategoryReference[] | undefined
  if (categories?.length) {
    record.categoryIds = categories.map((c: CategoryReference) => c.id)
  }

  // Map prices per locale — prefer country-specific price, fall back to currency match
  const prices: Price[] = masterVariant.prices ?? []
  const CURRENCY_MAP: Record<string, string> = {
    'en-US': 'USD',
    'de-DE': 'EUR',
  }
  for (const lang of LANGUAGES) {
    const country = lang.split('-')[1]
    const currency = CURRENCY_MAP[lang]
    const prefix = `price_${lang.replace('-', '_')}`
    const selectedPrice: Price | undefined =
      prices.find((p: Price) => p.country === country) ??
      prices.find((p: Price) => !p.country && p.value.currencyCode === currency)

    if (!selectedPrice) {
      continue
    }

    record[`${prefix}_centAmount`] = selectedPrice.value.centAmount
    record[`${prefix}_currency`] = selectedPrice.value.currencyCode
    record[`${prefix}_fractionDigits`] = selectedPrice.value.fractionDigits ?? 2

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

  const attrFields = extractVariantAttributes(allVariants, filterableAttributes)
  Object.assign(record, attrFields)

  return record
}

// ---- facet config ----
function buildFacetAttributes(
  filterableAttributes: FilterableAttribute[]
): string[] {
  const facetAttributes: string[] = []
  for (const a of filterableAttributes) {
    if (LOCALIZED_ATTR_TYPES.has(a.fieldType)) {
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
  return facetAttributes
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

    const result = await algoliaClient.saveObjects({
      indexName: algoliaIndexName,
      objects: allRecords,
    })

    console.log(`Done! Pushed ${allRecords.length} records.`, result)

    const facetAttributes = buildFacetAttributes(filterableAttributes)

    const attributeMetadata = filterableAttributes.map((a) => ({
      name: a.name,
      label: a.label,
      fieldType: a.fieldType,
    }))

    // Build virtual replica names for sorting
    const replicas: string[] = []
    for (const lang of LANGUAGES) {
      const langKey = lang.replace('-', '_')
      replicas.push(
        `virtual(${algoliaIndexName}_price_${langKey}_asc)`,
        `virtual(${algoliaIndexName}_price_${langKey}_desc)`,
        `virtual(${algoliaIndexName}_name_${langKey}_asc)`,
        `virtual(${algoliaIndexName}_name_${langKey}_desc)`
      )
    }
    replicas.push(`virtual(${algoliaIndexName}_newest)`)

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
    for (const lang of LANGUAGES) {
      const langKey = lang.replace('-', '_')
      const priceField = `price_${langKey}_centAmount`
      const nameField = `name_${langKey}`

      const replicaSettings: Array<{
        indexName: string
        ranking: string[]
      }> = [
        {
          indexName: `${algoliaIndexName}_price_${langKey}_asc`,
          ranking: [`asc(${priceField})`],
        },
        {
          indexName: `${algoliaIndexName}_price_${langKey}_desc`,
          ranking: [`desc(${priceField})`],
        },
        {
          indexName: `${algoliaIndexName}_name_${langKey}_asc`,
          ranking: [`asc(${nameField})`],
        },
        {
          indexName: `${algoliaIndexName}_name_${langKey}_desc`,
          ranking: [`desc(${nameField})`],
        },
      ]

      for (const { indexName, ranking } of replicaSettings) {
        await algoliaClient.setSettings({
          indexName,
          indexSettings: { customRanking: ranking },
        })
        console.log(`  Configured replica: ${indexName}`)
      }
    }

    await algoliaClient.setSettings({
      indexName: `${algoliaIndexName}_newest`,
      indexSettings: { customRanking: ['desc(createdAt)'] },
    })
    console.log(`  Configured replica: ${algoliaIndexName}_newest`)
  })

program.parse()
