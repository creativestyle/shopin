/**
 * The demo provider switch: each request picks its providers with X-<Category>-Provider headers, resolved
 * against the declared requirements; the ports installed once at boot forward every call to this request's
 * provider; a category nobody can serve for this request answers 501 with the reason; CORS gets the header
 * names.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HttpException,
  HttpStatus,
  NotImplementedException,
} from '@nestjs/common'
import switchModule from '../dist/index.js'

const { providerSwitch } = switchModule

const integration = (id, ports, requires) => ({
  id,
  label: id.toUpperCase(),
  ports: Object.fromEntries(ports.map((c) => [c, () => ({ category: c })])),
  ...(requires ? { requires } : {}),
})
const ct = integration('ct', ['commerce', 'search'])
const mock = integration('mock', ['commerce', 'search'])
const algolia = integration('algolia', ['search'], {
  search: { needs: { commerce: 'ct' }, reason: 'The index is fed from ct' },
})
const idp = integration('idp', ['auth'], {
  auth: {
    needs: { commerce: 'mock' },
    reason: 'idp signs in mock customers only',
  },
})
const lists = { commerce: [ct, mock], search: [algolia, ct, mock], auth: [idp] }

/** A fake port per provider: every method answers with the provider id, so forwarding is visible. */
const commercePort = (id) => ({
  productService: {
    getProduct: async (slug) => {
      if (slug === 'down') {
        throw new HttpException('vendor down', 503)
      }
      if (slug === 'unreachable') {
        // an SDK over fetch: the network error is the cause
        throw new TypeError('fetch failed', {
          cause: Object.assign(new Error('connect ECONNREFUSED'), {
            code: 'ECONNREFUSED',
          }),
        })
      }
      return `${id}:${slug}`
    },
  },
  cartService: {
    owner: id,
    whoAmI() {
      return this.owner
    },
  },
  customers: { findByEmail: async () => ({ id: `${id}-customer` }) },
})
const all = {
  commerce: { ct: commercePort('ct'), mock: commercePort('mock') },
  search: {
    algolia: { searchService: { searchProducts: async () => 'algolia' } },
    ct: { searchService: { searchProducts: async () => 'ct' } },
    mock: { searchService: { searchProducts: async () => 'mock' } },
  },
  auth: { idp: { signIn: async () => ({ identity: { subject: 'idp|1' } }) } },
}

/**
 * Builds the switch as the BFF does: each port's factory gets its delegates' ports and the request context, whose
 * headers the test points at one request at a time.
 */
function install(unavailable = {}) {
  let headers = {}
  const sw = providerSwitch(lists)
  const context = { header: (name) => headers[name.toLowerCase()] }
  const ports = {}
  const servedBy = {}
  for (const [category, load] of Object.entries(sw.ports)) {
    const definition = load()
    ports[category] = definition.useFactory(
      { ports: all[category] ?? {}, unavailable: unavailable[category] ?? {} },
      context
    )
    servedBy[category] = definition.servedBy
  }
  const current = () => ({
    providers: Object.fromEntries(
      Object.entries(servedBy).flatMap(([c, f]) => {
        const r = f()
        return r.id ? [[c, r.id]] : []
      })
    ),
    unavailable: Object.fromEntries(
      Object.entries(servedBy).flatMap(([c, f]) => {
        const r = f()
        return r.unavailable ? [[c, r.unavailable]] : []
      })
    ),
  })
  return { sw, ports, current, use: (h) => (headers = h) }
}

test('with no headers every category uses its first provider that fits', async () => {
  const s = install()
  s.use({})
  assert.deepEqual(s.current().providers, {
    commerce: 'ct',
    search: 'algolia',
  })
  assert.equal(
    await s.ports.commerce.productService.getProduct('shirt'),
    'ct:shirt'
  )
  assert.equal(await s.ports.search.searchService.searchProducts(), 'algolia')
})

test('each request is served by the providers its headers choose (case-insensitive values)', async () => {
  const s = install()
  s.use({ 'x-commerce-provider': ' Mock ', 'x-search-provider': 'mock' })
  assert.equal(await s.ports.commerce.productService.getProduct('a'), 'mock:a')
  assert.equal(await s.ports.search.searchService.searchProducts(), 'mock')
  // `this` stays bound to the chosen provider's service
  assert.equal(s.ports.commerce.cartService.whoAmI(), 'mock')
  assert.deepEqual(await s.ports.commerce.customers.findByEmail('x'), {
    id: 'mock-customer',
  })

  s.use({ 'x-commerce-provider': 'ct' })
  assert.equal(await s.ports.commerce.productService.getProduct('a'), 'ct:a')
  assert.equal(s.ports.commerce.cartService.whoAmI(), 'ct')
})

test('a choice its requirement rules out falls back to a provider that fits', async () => {
  const s = install()
  // algolia needs commerce ct; with mock commerce the search choice falls back to the next that fits
  s.use({ 'x-commerce-provider': 'mock', 'x-search-provider': 'algolia' })
  assert.equal(s.current().providers.search, 'ct')
  assert.equal(await s.ports.search.searchService.searchProducts(), 'ct')
})

test('a category no provider can serve for this request answers 501 with the reason', async () => {
  const s = install()
  s.use({ 'x-commerce-provider': 'ct' })
  assert.deepEqual(s.current().unavailable, {
    auth: 'idp signs in mock customers only',
  })
  assert.throws(
    () => s.ports.auth.signIn({ email: 'a@b.c', password: 'p' }),
    (err) =>
      err instanceof NotImplementedException &&
      err.getStatus() === HttpStatus.NOT_IMPLEMENTED &&
      err.message === 'auth is not available: idp signs in mock customers only'
  )

  s.use({ 'x-commerce-provider': 'mock' })
  assert.deepEqual(await s.ports.auth.signIn({}), {
    identity: { subject: 'idp|1' },
  })
})

test('the storefront variants: one dimension per category with a choice, every combination resolved or falling back', () => {
  const { dimensions, combinations } = install().sw.storefront.variants
  assert.deepEqual(
    dimensions.map((d) => [d.name, d.cookie, d.header, d.values, d.default]),
    [
      [
        'commerce',
        'shopin-commerce',
        'X-Commerce-Provider',
        ['ct', 'mock'],
        'ct',
      ],
      [
        'search',
        'shopin-search',
        'X-Search-Provider',
        ['algolia', 'ct', 'mock'],
        'algolia',
      ],
    ]
  )
  assert.deepEqual(combinations['ct__algolia'], {
    providers: { commerce: 'ct', search: 'algolia' },
    unavailable: { auth: 'idp signs in mock customers only' },
  })
  assert.deepEqual(combinations['mock__algolia'], { to: 'mock__ct' })
  assert.equal(Object.keys(combinations).length, 6)
})

test('a delegate the BFF could not load is passed over, and the default must serve', () => {
  const s = install({ commerce: { ct: 'its variables are not set (CT_KEY)' } })
  s.use({})
  assert.equal(s.current().providers.commerce, 'mock')
  assert.throws(
    () => providerSwitch({ commerce: [mock], search: [algolia, mock] }),
    /search lists "algolia" first, but it cannot serve: The index is fed from ct/
  )
})

test('the switch serves only the categories it lists, through every listed integration', () => {
  const { sw } = install()
  assert.deepEqual(Object.keys(sw.ports), ['commerce', 'search', 'auth'])
  assert.deepEqual(
    sw.delegates.map((d) => d.id),
    ['ct', 'mock', 'algolia', 'idp']
  )
})

test("a platform that is down (502, 503, 504) is named on the error: category and this request's provider", async () => {
  const s = install()
  s.use({ 'x-commerce-provider': 'ct' })
  const error = await s.ports.commerce.productService
    .getProduct('down')
    .catch((e) => e)
  assert.equal(error.getStatus(), 503)
  assert.deepEqual(error.vendor, { category: 'commerce', provider: 'ct' })
  // an SDK's network error (no status) is a platform that is down too
  const unreachable = await s.ports.commerce.productService
    .getProduct('unreachable')
    .catch((e) => e)
  assert.deepEqual(unreachable.vendor, { category: 'commerce', provider: 'ct' })
  // the shopper's own mistakes are not a vendor being down
  s.use({ 'x-commerce-provider': 'mock' })
  assert.equal(await s.ports.commerce.productService.getProduct('a'), 'mock:a')
})
