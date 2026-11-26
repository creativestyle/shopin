/**
 * The shop's card hook (`algolia({ mappers: { productCard } })`, docs/extending.md): it runs after the built-in
 * mapper on every search hit and sees the whole Algolia record, so a field the shop indexes reaches the card.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import service from '../dist/algolia-search.service.js'
import descriptor from '../dist/shopin.js'
import provider from '../dist/algolia-service-provider.js'

const hit = {
  objectID: 'p1',
  name_en_US: 'Pool',
  slug: { 'en-US': 'pool' },
  poolType: 'above-ground',
}
const client = {
  getSettings: async () => ({}),
  searchSingleIndex: async () => ({ hits: [hit], facets: {}, nbHits: 1 }),
}
const search = (hook) =>
  new service.AlgoliaSearchService(client, 'products', hook).searchProducts({
    query: 'pool',
    language: 'en-US',
  })

test('the card hook adds the shop field from the record after the built-in mapper', async () => {
  const { products } = await search((raw, mapped) => ({
    ...mapped,
    poolType: raw.poolType,
  }))
  assert.equal(products[0].poolType, 'above-ground')
  assert.equal(products[0].name, 'Pool')
})

test('without a hook the card carries no shop field', async () => {
  const { products } = await search(undefined)
  assert.equal(products[0].poolType, undefined)
})

test('the descriptor hands the hooks to the search port as a provider', () => {
  const productCard = (raw, mapped) => mapped
  const port = descriptor
    .algolia({
      mappers: { productCard },
    })
    .ports.search()
  const hooks = port.providers.find(
    (p) => p.provide === provider.AlgoliaMapperHooks
  )
  assert.equal(hooks.useValue.productCard, productCard)
})
