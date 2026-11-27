/**
 * Records the commerce contract suite against a real commercetools project, for the replay test
 * (commerce-contract-recorded.test.mjs). Run by hand, never in CI: `npm run record:contract` (reads the repository's
 * .env; the package must be built). It creates carts, customers and orders in that project (e-mails
 * `contract-…@example.com`). `CONTRACT_CATEGORY=<slug>` adds the category case.
 *
 * Written to test/recorded/commerce-contract.json, per case: whether it passed, and the responses its requests got.
 * The project's hosts and key become RECORDED's, access and refresh tokens become placeholders, and every `clientId`
 * (who created a resource) is dropped: the file holds no credential and names no project.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import testing from '@core/integration-kit/testing'
import descriptor from '../dist/shopin.js'
import storeChannels from '../dist/services/store-channels.service.js'
import {
  contractCases,
  RECORDED,
  RECORDING,
  STORE_KEYS,
} from './contract-run.mjs'

const env = (name) => {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is not set (the repository's .env)`)
  }
  return value
}
const real = {
  clientId: env('COMMERCETOOLS_CLIENT_ID'),
  clientSecret: env('COMMERCETOOLS_CLIENT_SECRET'),
  projectKey: env('COMMERCETOOLS_PROJECT_KEY'),
  apiUrl: env('COMMERCETOOLS_API_URL').replace(/\/+$/, ''),
  authUrl: env('COMMERCETOOLS_AUTH_URL').replace(/\/+$/, ''),
  linkCustomers: '1',
}

/** The recorded form of a text: the project's hosts and key replaced. */
const scrub = (text) =>
  text
    .split(real.apiUrl)
    .join(RECORDED.apiUrl)
    .split(real.authUrl)
    .join(RECORDED.authUrl)
    .split(real.projectKey)
    .join(RECORDED.projectKey)
const scrubBody = (body) =>
  JSON.parse(
    scrub(
      JSON.stringify(body, (key, value) =>
        key === 'clientId'
          ? undefined
          : key === 'access_token' || key === 'refresh_token'
            ? `recorded-${key}`
            : value
      )
    )
  )

const realFetch = globalThis.fetch
let responses = {}
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input)
  const method = (
    init?.method ?? (input instanceof Request ? input.method : 'GET')
  ).toUpperCase()
  const response = await realFetch(input, init)
  const text = await response.clone().text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  const key = `${method} ${scrub(url)}`
  const list = (responses[key] ??= [])
  list.push({ status: response.status, body: scrubBody(body) })
  return response
}

// a product of the project, found through the port before recording starts
const recording = globalThis.fetch
globalThis.fetch = realFetch
const finder = await testing.buildPort(
  descriptor.commercetools({ storeKeys: STORE_KEYS }).ports.commerce(),
  {
    storefrontUrl: 'https://shop.test',
    options: real,
    locales: Object.keys(STORE_KEYS),
  }
)
// as the start-up check does: the stores' distribution channels, before any price is asked for
await finder[storeChannels.STORE_CHANNELS].load()
const slug = (
  await finder.productSearchService.searchProducts({ query: '', limit: 1 })
).products[0]?.slug
if (!slug) {
  throw new Error('the project has no product to put in a cart')
}
globalThis.fetch = recording
const category = process.env.CONTRACT_CATEGORY?.trim()
const data = {
  product: { slug },
  ...(category ? { category: { slug: category } } : {}),
  cart: true,
  customers: true,
  orders: true,
}

const cases = {}
for (const c of contractCases(real, data)) {
  responses = {}
  let outcome = 'passed'
  try {
    await c.run({ skip: (reason) => (outcome = `skipped: ${reason}`) })
  } catch (error) {
    outcome = `failed: ${error?.message ?? error}`
  }
  cases[c.name] = { outcome, responses: outcome === 'passed' ? responses : {} }
  console.log(`${outcome.split(':')[0]}  ${c.name}`)
}

mkdirSync(new URL('.', RECORDING), { recursive: true })
writeFileSync(
  RECORDING,
  JSON.stringify(
    { recordedAt: new Date().toISOString().slice(0, 10), data, cases },
    null,
    2
  ) + '\n'
)
console.log(`written: ${RECORDING.pathname}`)
