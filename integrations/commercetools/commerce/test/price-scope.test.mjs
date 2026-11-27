/**
 * With the store's distribution channel, cards show that channel's price (`priceChannel` on the projections), so the
 * price range filter, the price facet and the price sort of the same Product Search use that channel's price in the
 * request's currency too: exact conditions on `variants.prices.channel` (the Channel id) and
 * `variants.prices.currencyCode`, in the range's `and`, as the price facet's `filter` and as the price sort's `filter`
 * (commercetools Product Search, "filter by the price scopes that apply and combine them with an AND expression";
 * "Sort by scoped price"). Without a channel the search body is exactly the one sent before channels were read.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import productSearch from '../dist/services/product-search.service.js'
import productCollection from '../dist/services/product-collection.service.js'
import { FakeProjectClient } from './fake-client.mjs'

const { ProductSearchService } = productSearch
const { ProductCollectionService } = productCollection

const CATEGORY = {
  id: 'cat-1',
  slug: { 'en-US': 'shirts' },
  name: { 'en-US': 'Shirts' },
  ancestors: [],
}

/** A Product Search client answering one hit, keeping every search body it gets. */
function client() {
  const server = new FakeProjectClient()
  const bodies = []
  return {
    bodies,
    categories: () => ({
      get: () => ({
        execute: async () => ({ body: { results: [CATEGORY] } }),
      }),
    }),
    products: () => ({
      search: () => ({
        post: ({ body }) => ({
          execute: async () => {
            bodies.push(body)
            return {
              body: { results: [{ id: 'ct-product-1' }], total: 1, facets: [] },
            }
          },
        }),
      }),
    }),
    productProjections: () => server.productProjections(),
  }
}

const language = { getCurrentLanguage: () => 'en-US' }
const attributes = { getFilterableAttributes: async () => [] }
const channels = (priceChannel) => ({ priceChannel: () => priceChannel })

const pages = {
  'the results page': async (priceChannel, sort) => {
    const c = client()
    await new ProductSearchService(
      c,
      language,
      attributes,
      channels(priceChannel)
    ).searchProducts({
      query: 'linen',
      faceted: true,
      priceMin: 1000,
      priceMax: 5000,
      sort,
    })
    return c.bodies
  },
  'a category page': async (priceChannel, sort) => {
    const c = client()
    await new ProductCollectionService(
      c,
      language,
      attributes,
      channels(priceChannel)
    ).getProductCollection('shirts', 1, 24, sort, undefined, false, 1000, 5000)
    return c.bodies
  },
}

const SCOPE = {
  and: [
    { exact: { field: 'variants.prices.channel', value: 'channel-us' } },
    { exact: { field: 'variants.prices.currencyCode', value: 'USD' } },
  ],
}
// as sent before channels were read
const RANGE = {
  and: [
    { exact: { field: 'variants.prices.currencyCode', value: 'USD' } },
    {
      range: { field: 'variants.prices.centAmount', gte: 1000, lte: 5000 },
    },
  ],
}
const PRICE_FACET = {
  distinct: {
    name: 'price-facet',
    field: 'variants.prices.centAmount',
    level: 'variants',
    fieldType: 'number',
  },
}

describe('commercetools search and category pages: price filter, facet and sort by the store’s channel', () => {
  for (const [page, run] of Object.entries(pages)) {
    for (const [sort, order] of [
      ['price-asc', 'asc'],
      ['price-desc', 'desc'],
    ]) {
      it(`${page}, ${sort}: with a channel, the range, the price facet and the sort carry the channel and currency`, async () => {
        const [main, counts] = await run('channel-us', sort)

        assert.deepEqual(main.postFilter, {
          and: [
            RANGE.and[0],
            {
              exact: { field: 'variants.prices.channel', value: 'channel-us' },
            },
            RANGE.and[1],
          ],
        })
        assert.deepEqual(main.facets, [
          { distinct: { ...PRICE_FACET.distinct, filter: SCOPE } },
        ])
        assert.deepEqual(counts.facets, main.facets)
        assert.deepEqual(main.sort, [
          { field: 'variants.prices.centAmount', order, filter: SCOPE },
        ])
      })

      it(`${page}, ${sort}: without a channel, the search body is the one sent before`, async () => {
        const [main, counts] = await run(undefined, sort)

        assert.equal(
          JSON.stringify({
            postFilter: main.postFilter,
            facets: main.facets,
            sort: main.sort,
          }),
          JSON.stringify({
            postFilter: RANGE,
            facets: [PRICE_FACET],
            sort: [{ field: 'variants.prices.centAmount', order }],
          })
        )
        assert.equal(
          JSON.stringify(counts.facets),
          JSON.stringify([PRICE_FACET])
        )
      })
    }
  }

  it('a sort not by price takes no price filter, with or without a channel', async () => {
    for (const priceChannel of ['channel-us', undefined]) {
      const [main] = await pages['a category page'](priceChannel, 'newest')
      assert.deepEqual(main.sort, [{ field: 'createdAt', order: 'desc' }])
    }
  })
})
