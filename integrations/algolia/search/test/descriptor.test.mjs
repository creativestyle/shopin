/**
 * The Algolia descriptor: serves search only, declares its three variables (the BFF reads them, the port
 * never reads process.env), needs commercetools commerce (the sync tool feeds the index from it), and
 * loads the search port lazily.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import descriptor from '../dist/shopin.js'

test('search needs commercetools commerce, the catalog the sync tool feeds the index from', () => {
  const { requires } = descriptor.algolia()
  assert.deepEqual(requires.search.needs, { commerce: 'commercetools' })
  assert.match(requires.search.reason.en, /commercetools/)
  assert.match(requires.search.reason.de, /commercetools/)
})

test('search declares its variables and loads a search port', () => {
  const algolia = descriptor.algolia()
  assert.equal(algolia.id, 'algolia')
  assert.deepEqual(Object.keys(algolia.ports), ['search'])
  assert.deepEqual(
    Object.values(algolia.env.search).map((v) => v.env),
    ['ALGOLIA_APP_ID', 'ALGOLIA_SEARCH_API_KEY', 'ALGOLIA_INDEX_NAME']
  )
  assert.equal(algolia.ports.search().category, 'search')
})
