/**
 * Channels come from the store `storeKeys` selects, not from a second setting. Every configured store is read once,
 * by the start-up check (the port's probe); a store that cannot be read fails that check (the BFF then marks commerce
 * unavailable) and requests never read stores. When the store has a distribution channel, prices are selected by
 * it: product projection queries (product page, search, category pages, wishlist) send `priceChannel`, and a line
 * item added to the cart names it as its `distributionChannel`. When the store has none, the requests are the ones
 * sent before channels were read (currency and country only). Stock is not touched: it stays summed over all supply
 * channels (cart-inventory tests).
 */
import { after, afterEach, before, describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Logger } from '@nestjs/common'
import { buildPort } from '@core/integration-kit/testing'
import shopin from '../dist/shopin.js'
import core from '@integrations/commercetools-core'
import storeChannels from '../dist/services/store-channels.service.js'
import productSearch from '../dist/services/product-search.service.js'
import productCollection from '../dist/services/product-collection.service.js'
import stores from '../dist/config/stores.js'
import { FakeMeClient, FakeProjectClient } from './fake-client.mjs'

const { commercetools } = shopin
const { COMMERCETOOLS_CLIENT, UserClientService } = core
const { StoreChannels, STORE_CHANNELS } = storeChannels
const { ProductSearchService } = productSearch
const { ProductCollectionService } = productCollection
const { storeKeysFor } = stores

const OPTIONS = {
  projectKey: 'proj',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://api.fake.invalid',
  authUrl: 'https://auth.fake.invalid',
  linkCustomers: '1',
}
const PRODUCT = {
  id: 'ct-product-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  name: { 'en-US': 'Linen shirt' },
  slug: { 'en-US': 'linen-shirt' },
  masterVariant: {
    id: 1,
    prices: [
      {
        id: 'price-1',
        value: {
          type: 'centPrecision',
          centAmount: 4900,
          currencyCode: 'USD',
          fractionDigits: 2,
        },
      },
    ],
  },
}
const channel = (id) => ({ typeId: 'channel', id })

/**
 * The port for customer `ct-customer-1` (linked, no commercetools token: it acts through the project API), with a
 * cart and a wishlist holding the product, and `store` (if given) as the en-US store. `start()` runs the start-up
 * check as the BFF does (token and scope requests answered by the fetch stub below).
 */
async function port(store) {
  const server = new FakeProjectClient()
  if (store) {
    server.stores_.push(store)
  }
  server.products_.push(PRODUCT)
  server.carts_.push({
    id: 'ct-cart-1',
    version: 1,
    customerId: 'ct-customer-1',
    currency: 'USD',
    lineItems: [],
    totalPrice: { centAmount: 0, currencyCode: 'USD' },
  })
  server.lists_.push({
    id: 'ct-list-1',
    version: 1,
    customer: { id: 'ct-customer-1' },
    lineItems: [
      {
        id: 'ct-list-line-1',
        productId: 'ct-product-1',
        name: { 'en-US': 'Linen shirt' },
        variant: { id: 1 },
        quantity: 1,
      },
    ],
  })
  const user = {
    getClient: async () =>
      new FakeMeClient('anon-token', { carts: new Set() }, []),
  }
  const definition = commercetools({
    storeKeys: { 'en-US': 'us-store' },
  }).ports.commerce()
  const commerce = await buildPort(definition, {
    storefrontUrl: 'https://shop.test',
    options: OPTIONS,
    customerId: 'ct-customer-1',
    providers: [
      { provide: COMMERCETOOLS_CLIENT, useValue: server },
      { provide: UserClientService, useValue: user },
    ],
  })
  return {
    commerce,
    server,
    start: () => definition.probe(commerce, OPTIONS),
  }
}

/** Product page, add to cart and the wishlist's price lookup, in that order. */
async function shop(commerce) {
  await commerce.productService.getProduct('linen-shirt')
  await commerce.cartService.addToCart('ct-cart-1', 'ct-product-1', '1', 1)
  await commerce.wishlistService.getOrCreateWishlist()
}

const addLineItems = (server) =>
  server.cartActions.filter((a) => a.action === 'addLineItem')

describe('commercetools prices by the store’s distribution channel', () => {
  // the start-up check's token and scope requests (customer linking on): an admin client
  const real = globalThis.fetch
  before(() => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ scope: 'manage_project:proj' }), {
        status: 200,
      })
  })
  after(() => {
    globalThis.fetch = real
  })

  it('a store with a distribution channel: read once at start; projection queries carry priceChannel, the added line item names the channel; requests read no store', async () => {
    const { commerce, server, start } = await port({
      key: 'us-store',
      distributionChannels: [channel('channel-us')],
    })

    await start()
    assert.deepEqual(server.storeCalls, ['GET stores/key=us-store'])
    await shop(commerce)

    const [product, wishlist] = server.projectionQueries
    assert.equal(server.projectionQueries.length, 2)
    assert.equal(product.priceChannel, 'channel-us')
    assert.equal(wishlist.priceChannel, 'channel-us')
    // currency and country still select within the channel
    assert.equal(product.priceCurrency, 'USD')
    assert.equal(product.priceCountry, 'US')
    assert.deepEqual(addLineItems(server), [
      {
        action: 'addLineItem',
        productId: 'ct-product-1',
        variantId: 1,
        quantity: 1,
        distributionChannel: channel('channel-us'),
      },
    ])
    // the requests read no store: still only the start-up read
    assert.deepEqual(server.storeCalls, ['GET stores/key=us-store'])
  })

  it('a store without a distribution channel: the requests are exactly the ones sent before channels were read', async () => {
    const { commerce, server, start } = await port({
      key: 'us-store',
      distributionChannels: [],
    })

    await start()
    await shop(commerce)

    // as JSON, the way the request goes out: same keys, same order, nothing added
    assert.deepEqual(
      server.projectionQueries.map((q) => JSON.stringify(q)),
      [
        JSON.stringify({
          where: 'slug(en-US="linen-shirt")',
          staged: false,
          expand: [
            'productType',
            'categories[*]',
            'categories[*].ancestors[*]',
          ],
          limit: 1,
          priceCurrency: 'USD',
          priceCountry: 'US',
        }),
        JSON.stringify({
          where: 'id in ("ct-product-1")',
          staged: false,
          localeProjection: 'en-US',
          priceCurrency: 'USD',
          priceCountry: 'US',
          limit: 1,
        }),
      ]
    )
    assert.deepEqual(
      addLineItems(server).map((a) => JSON.stringify(a)),
      [
        JSON.stringify({
          action: 'addLineItem',
          productId: 'ct-product-1',
          variantId: 1,
          quantity: 1,
        }),
      ]
    )
    assert.deepEqual(server.storeCalls, ['GET stores/key=us-store'])
  })

  it('a store that cannot be read fails the start-up check; requests then fail rather than price without the channel', async () => {
    const { commerce, server, start } = await port(undefined)

    await assert.rejects(start(), {
      message: /^commercetools Store "us-store" cannot be read .*HTTP 404$/,
    })
    await assert.rejects(commerce.productService.getProduct('linen-shirt'), {
      message: /read by the start-up check, which has not run/,
    })
    assert.deepEqual(server.projectionQueries, [])
    assert.deepEqual(server.storeCalls, ['GET stores/key=us-store'])
  })
})

describe('commercetools StoreChannels', () => {
  afterEach(() => mock.restoreAll())

  // fr-FR is not a shop locale in config/locales.json, so its currency is the default locale's (USD, as en-US):
  // it shares en-US's store, as stores of one currency must share their channel (below)
  const LOCALES = ['en-US', 'de-DE', 'fr-FR']
  const KEYS = { 'en-US': 'us-store', 'de-DE': 'eu-store', 'fr-FR': 'us-store' }
  function channels(server, language = { current: 'en-US' }, keys = KEYS) {
    return new StoreChannels(
      server,
      { getCurrentLanguage: () => language.current },
      storeKeysFor(undefined, keys, LOCALES)
    )
  }

  it('load reads every configured store once; the lookup per locale reads none', async () => {
    const server = new FakeProjectClient()
    server.stores_.push(
      { key: 'us-store', distributionChannels: [channel('channel-us')] },
      { key: 'eu-store', distributionChannels: [] }
    )
    const language = { current: 'en-US' }
    const c = channels(server, language)

    await c.load()
    assert.equal(c.priceChannel(), 'channel-us')
    language.current = 'de-DE'
    assert.equal(c.priceChannel(), undefined)
    language.current = 'fr-FR'
    assert.equal(c.priceChannel(), 'channel-us')

    assert.deepEqual(server.storeCalls, [
      'GET stores/key=us-store',
      'GET stores/key=eu-store',
    ])
  })

  it('a store with several channels: the first, named once in the log', async () => {
    const warn = mock.method(Logger.prototype, 'warn', () => {})
    const server = new FakeProjectClient()
    server.stores_.push(
      {
        key: 'us-store',
        distributionChannels: [channel('channel-a'), channel('channel-b')],
      },
      { key: 'eu-store', distributionChannels: [] }
    )
    const c = channels(server)

    await c.load()
    assert.equal(c.priceChannel(), 'channel-a')
    assert.equal(c.priceChannel(), 'channel-a')

    assert.equal(warn.mock.callCount(), 1)
    assert.match(
      warn.mock.calls[0].arguments[0],
      /"us-store" has 2 distribution channels; prices are selected by the first, channel-a/
    )
  })

  it('before the start-up read, the lookup throws instead of answering "no channel"', () => {
    const c = channels(new FakeProjectClient())
    assert.throws(() => c.priceChannel(), {
      message: /read by the start-up check, which has not run/,
    })
  })

  // carts are kept per currency (not per store): two stores of one currency with different channels would put line
  // items priced by both channels into one cart, so that configuration fails the start-up check
  for (const [why, fr] of [
    ['different channels', [channel('channel-fr')]],
    ['one channel, the other none', []],
  ]) {
    it(`two stores sharing a currency with ${why} fail the load, naming both stores and the currency`, async () => {
      const server = new FakeProjectClient()
      server.stores_.push(
        { key: 'us-store', distributionChannels: [channel('channel-us')] },
        { key: 'eu-store', distributionChannels: [] },
        { key: 'fr-store', distributionChannels: fr }
      )
      const c = channels(server, undefined, {
        'en-US': 'us-store',
        'de-DE': 'eu-store',
        'fr-FR': 'fr-store',
      })

      await assert.rejects(c.load(), (error) => {
        assert.match(
          error.message,
          /^commercetools Stores "us-store" \(channel channel-us\), "fr-store" /
        )
        assert.match(
          error.message,
          / share the currency USD but not the distribution channel/
        )
        assert.doesNotMatch(error.message, /eu-store/)
        return true
      })
      assert.throws(() => c.priceChannel(), { message: /which has not run/ })
    })
  }

  it('two stores sharing a currency with the same channel pass the load', async () => {
    const server = new FakeProjectClient()
    server.stores_.push(
      { key: 'us-store', distributionChannels: [channel('channel-us')] },
      { key: 'eu-store', distributionChannels: [] },
      { key: 'fr-store', distributionChannels: [channel('channel-us')] }
    )
    const language = { current: 'fr-FR' }
    const c = channels(server, language, {
      'en-US': 'us-store',
      'de-DE': 'eu-store',
      'fr-FR': 'fr-store',
    })

    await c.load()
    assert.equal(c.priceChannel(), 'channel-us')
    language.current = 'de-DE'
    assert.equal(c.priceChannel(), undefined)
  })

  it('a store the API client may not read (403): names the scope it needs', async () => {
    const server = new FakeProjectClient()
    server.stores_.push({ key: 'eu-store', distributionChannels: [] })
    server.stores = () => ({
      withKey: () => ({
        get: () => ({
          execute: async () => {
            throw Object.assign(
              new Error(
                'Insufficient scope. One of the following scopes is missing: view_stores'
              ),
              { statusCode: 403, body: { statusCode: 403 } }
            )
          },
        }),
      }),
    })
    await assert.rejects(channels(server).load(), {
      message:
        /^commercetools Store "us-store" cannot be read: HTTP 403, the API client needs the scope view_stores \(or manage_stores\)/,
    })
  })

  it('one store that cannot be read fails the load, and no store is answered for (no partial map)', async () => {
    const server = new FakeProjectClient()
    server.stores_.push({
      key: 'us-store',
      distributionChannels: [channel('channel-us')],
    })
    const c = channels(server)

    await assert.rejects(c.load(), {
      message: /^commercetools Store "eu-store" cannot be read/,
    })
    assert.throws(() => c.priceChannel(), {
      message: /which has not run/,
    })
  })
})

describe('commercetools search and category cards: prices by the store’s channel', () => {
  /** Product search answering one hit; the projections come from `server`. */
  function search(server, priceChannel) {
    const client = {
      products: () => ({
        search: () => ({
          post: () => ({
            execute: async () => ({
              body: { results: [{ id: 'ct-product-1' }], total: 1, facets: [] },
            }),
          }),
        }),
      }),
      productProjections: () => server.productProjections(),
    }
    return new ProductSearchService(
      client,
      { getCurrentLanguage: () => 'en-US' },
      { getFilterableAttributes: async () => [] },
      { priceChannel: () => priceChannel }
    )
  }

  for (const faceted of [false, true]) {
    it(`${faceted ? 'the results page' : 'the search popup'}: priceChannel with a channel, none without`, async () => {
      const withChannel = new FakeProjectClient()
      await search(withChannel, 'channel-us').searchProducts({
        query: 'linen',
        faceted,
      })
      assert.equal(withChannel.projectionQueries[0]?.priceChannel, 'channel-us')

      const without = new FakeProjectClient()
      await search(without, undefined).searchProducts({
        query: 'linen',
        faceted,
      })
      assert.equal(without.projectionQueries.length, 1)
      assert.equal('priceChannel' in without.projectionQueries[0], false)
    })
  }

  it('a category page: priceChannel with a channel, none without', async () => {
    const category = {
      id: 'cat-1',
      slug: { 'en-US': 'shirts' },
      name: { 'en-US': 'Shirts' },
      ancestors: [],
    }
    const collection = (server, priceChannel) =>
      new ProductCollectionService(
        {
          categories: () => ({
            get: () => ({
              execute: async () => ({ body: { results: [category] } }),
            }),
          }),
          products: () => ({
            search: () => ({
              post: () => ({
                execute: async () => ({
                  body: { results: [{ id: 'ct-product-1' }], total: 1 },
                }),
              }),
            }),
          }),
          productProjections: () => server.productProjections(),
        },
        { getCurrentLanguage: () => 'en-US' },
        { getFilterableAttributes: async () => [] },
        { priceChannel: () => priceChannel }
      )

    const withChannel = new FakeProjectClient()
    await collection(withChannel, 'channel-us').getProductCollection('shirts')
    assert.equal(withChannel.projectionQueries[0]?.priceChannel, 'channel-us')

    const without = new FakeProjectClient()
    await collection(without, undefined).getProductCollection('shirts')
    assert.equal(without.projectionQueries.length, 1)
    assert.equal('priceChannel' in without.projectionQueries[0], false)
  })
})
