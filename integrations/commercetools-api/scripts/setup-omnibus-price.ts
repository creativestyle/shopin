#!/usr/bin/env node
/**
 * Set up and backfill the "omnibus" price (lowest price in the last 30 days)
 * custom field on commercetools prices.
 *
 * Usage: npm run setup:omnibus -- [options]
 *
 * Reads CT credentials from the root .env file.
 *
 * What it does:
 *   1. Ensures a `product-price` custom Type exists that defines the
 *      `omnibusPrice` (and `recommendedRetailPrice`) Number fields. The
 *      storefront reads `price.custom.fields.omnibusPrice`
 *      (see integrations/commercetools-api/src/mappers/price.ts).
 *   2. Iterates every product and sets `omnibusPrice` (in cents) on each
 *      variant price, via product update actions, then optionally publishes.
 *
 * Options:
 *   --apply            Actually write to commercetools. WITHOUT this flag the
 *                      script only reports what it would change (dry run).
 *   --publish          After writing to staged, publish the product so the
 *                      change is live. Implies --apply.
 *   --discounted-only  Only set omnibusPrice on prices that have a discount
 *                      (the storefront only shows the line for discounted
 *                      products anyway).
 *   --limit=N          Stop after processing N products (useful for testing).
 *
 * NOTE ON THE VALUE: commercetools has no built-in price history, so this
 * script cannot compute a *real* 30-day low. `computeOmnibusCents()` below
 * produces a plausible DEMO value derived from the current price. Replace that
 * function (or feed values from your PIM/ERP) for production-correct data.
 */
import { ClientBuilder } from '@commercetools/ts-client'
import {
  createApiBuilderFromCtpClient,
  type ByProjectKeyRequestBuilder,
  type Price,
  type Product,
  type ProductUpdateAction,
  type Type,
} from '@commercetools/platform-sdk'

const TYPE_KEY = 'shopin-price-custom-fields'
const PAGE_SIZE = 100

interface Options {
  apply: boolean
  publish: boolean
  discountedOnly: boolean
  limit: number | undefined
}

function parseArgs(argv: string[]): Options {
  const has = (flag: string): boolean => argv.includes(flag)
  const limitArg = argv.find((a) => a.startsWith('--limit='))
  return {
    apply: has('--apply') || has('--publish'),
    publish: has('--publish'),
    discountedOnly: has('--discounted-only'),
    limit: limitArg ? Number(limitArg.split('=')[1]) : undefined,
  }
}

/**
 * DEMO computation of the omnibus (lowest-30-day) value, in cents.
 *
 * Real rule: the lowest price the product was sold at in the previous 30 days.
 * Here we approximate it as 10% below the regular price, but never below the
 * current discounted price. Swap this out for real history-derived values.
 */
function computeOmnibusCents(price: Price): number {
  const regular = price.value.centAmount
  const discounted = price.discounted?.value.centAmount
  const approx = Math.round(regular * 0.9)
  return discounted !== undefined ? Math.max(approx, discounted) : approx
}

/** Human-readable identifier for a product, for logging. */
function productLabel(product: Product): string {
  const name = product.masterData.current.name
  const readableName = name['en-US'] ?? name['de-DE'] ?? Object.values(name)[0]
  const slug = product.masterData.current.slug
  const readableSlug = slug['en-US'] ?? slug['de-DE'] ?? Object.values(slug)[0]
  const parts = [readableName ?? '(no name)', `id=${product.id}`]
  if (product.key) {
    parts.push(`key=${product.key}`)
  }
  if (readableSlug) {
    parts.push(`slug=${readableSlug}`)
  }
  return parts.join(' | ')
}

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function buildClient(): {
  api: ByProjectKeyRequestBuilder
  projectKey: string
} {
  const projectKey = getEnv('COMMERCETOOLS_PROJECT_KEY')
  // Prefer dedicated admin credentials (need manage_types + manage_products)
  // and fall back to the default storefront client for read-only dry runs.
  const clientId =
    process.env.COMMERCETOOLS_ADMIN_CLIENT_ID ??
    getEnv('COMMERCETOOLS_CLIENT_ID')
  const clientSecret =
    process.env.COMMERCETOOLS_ADMIN_CLIENT_SECRET ??
    getEnv('COMMERCETOOLS_CLIENT_SECRET')
  const client = new ClientBuilder()
    .withClientCredentialsFlow({
      credentials: { clientId, clientSecret },
      projectKey,
      host: getEnv('COMMERCETOOLS_AUTH_URL'),
    })
    .withHttpMiddleware({ host: getEnv('COMMERCETOOLS_API_URL') })
    .build()

  const api = createApiBuilderFromCtpClient(client).withProjectKey({
    projectKey,
  })
  return { api, projectKey }
}

const FIELD_DEFINITIONS = [
  {
    name: 'omnibusPrice',
    label: { en: 'Omnibus price (lowest in last 30 days, in cents)' },
    required: false,
    type: { name: 'Number' as const },
    inputHint: 'SingleLine' as const,
  },
  {
    name: 'recommendedRetailPrice',
    label: { en: 'Recommended retail price (in cents)' },
    required: false,
    type: { name: 'Number' as const },
    inputHint: 'SingleLine' as const,
  },
]

/** Ensure the price custom Type exists and has our field definitions. */
async function ensureType(
  api: ByProjectKeyRequestBuilder,
  apply: boolean
): Promise<Type | null> {
  const existing = await api
    .types()
    .get({ queryArgs: { where: `key="${TYPE_KEY}"` } })
    .execute()

  let type = existing.body.results[0]

  if (!type) {
    console.log(`Type "${TYPE_KEY}" not found.`)
    if (!apply) {
      console.log('  [dry run] would CREATE the price custom type.')
      return null
    }
    const created = await api
      .types()
      .post({
        body: {
          key: TYPE_KEY,
          name: { en: 'SHOPin price custom fields' },
          resourceTypeIds: ['product-price'],
          fieldDefinitions: FIELD_DEFINITIONS,
        },
      })
      .execute()
    console.log('  Created price custom type.')
    return created.body
  }

  // Type exists — add any missing field definitions.
  const existingFields = new Set(type.fieldDefinitions.map((f) => f.name))
  const missing = FIELD_DEFINITIONS.filter((f) => !existingFields.has(f.name))
  if (missing.length > 0) {
    console.log(
      `Type exists but missing fields: ${missing.map((f) => f.name).join(', ')}`
    )
    if (!apply) {
      console.log('  [dry run] would ADD the missing field definitions.')
      return type
    }
    const updated = await api
      .types()
      .withId({ ID: type.id })
      .post({
        body: {
          version: type.version,
          actions: missing.map((f) => ({
            action: 'addFieldDefinition' as const,
            fieldDefinition: f,
          })),
        },
      })
      .execute()
    console.log('  Added missing field definitions.')
    type = updated.body
  } else {
    console.log(`Type "${TYPE_KEY}" already has the required fields.`)
  }

  return type
}

/** Build the update actions needed for one product's prices. */
function buildActionsForPrices(
  prices: Price[],
  typeId: string | null,
  opts: Options
): ProductUpdateAction[] {
  const actions: ProductUpdateAction[] = []
  for (const price of prices) {
    if (opts.discountedOnly && price.discounted === undefined) {
      continue
    }
    const value = computeOmnibusCents(price)
    const alreadyOurType = price.custom?.type.id === typeId
    if (alreadyOurType) {
      // Only patch the single field; skip if unchanged.
      if (price.custom?.fields?.omnibusPrice === value) {
        continue
      }
      actions.push({
        action: 'setProductPriceCustomField',
        priceId: price.id,
        staged: true,
        name: 'omnibusPrice',
        value,
      })
    } else {
      actions.push({
        action: 'setProductPriceCustomType',
        priceId: price.id,
        staged: true,
        type: { key: TYPE_KEY, typeId: 'type' },
        fields: { omnibusPrice: value },
      })
    }
  }
  return actions
}

async function run(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2))
  const { api, projectKey } = buildClient()

  console.log(`Project: ${projectKey}`)
  console.log(
    opts.apply
      ? `Mode: APPLY${opts.publish ? ' + PUBLISH' : ' (staged only)'}`
      : 'Mode: DRY RUN (no writes) — pass --apply to write'
  )
  if (opts.discountedOnly) {
    console.log('Scope: discounted prices only')
  }
  console.log('')

  const type = await ensureType(api, opts.apply)
  const typeId = type?.id ?? null
  console.log('')

  let offset = 0
  let processed = 0
  let productsChanged = 0
  let pricesChanged = 0

  for (;;) {
    if (opts.limit !== undefined && processed >= opts.limit) {
      break
    }
    const page = await api
      .products()
      .get({ queryArgs: { limit: PAGE_SIZE, offset } })
      .execute()

    const products = page.body.results
    if (products.length === 0) {
      break
    }

    for (const product of products) {
      if (opts.limit !== undefined && processed >= opts.limit) {
        break
      }
      processed++

      // Use staged data so we can publish it explicitly.
      const staged = product.masterData.staged
      const variants = [staged.masterVariant, ...staged.variants]
      const prices = variants.flatMap((v) => v.prices ?? [])

      const actions = buildActionsForPrices(prices, typeId, opts)
      if (actions.length === 0) {
        continue
      }

      productsChanged++
      pricesChanged += actions.length

      if (!opts.apply) {
        console.log(
          `[dry run] ${productLabel(product)}: ` +
            `${actions.length} price(s) would be updated`
        )
        continue
      }

      const finalActions: ProductUpdateAction[] = opts.publish
        ? [...actions, { action: 'publish' }]
        : actions
      await api
        .products()
        .withId({ ID: product.id })
        .post({ body: { version: product.version, actions: finalActions } })
        .execute()
      console.log(
        `Updated ${productLabel(product)} (${actions.length} price(s))`
      )
    }

    offset += products.length
    if (products.length < PAGE_SIZE) {
      break
    }
  }

  console.log('')
  console.log(
    `Done. Products processed: ${processed}, ` +
      `products ${opts.apply ? 'changed' : 'to change'}: ${productsChanged}, ` +
      `prices ${opts.apply ? 'changed' : 'to change'}: ${pricesChanged}`
  )
  if (!opts.apply) {
    console.log('Re-run with --apply (and --publish to go live) to write.')
  }
}

run().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
