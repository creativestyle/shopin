/**
 * The credentials check at start: the index's settings with the search key. An unreachable host stops it with a
 * message naming the host and ALGOLIA_APP_ID; a refused key names ALGOLIA_SEARCH_API_KEY.
 */
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import bff from '../dist/bff.js'

const definition = bff.default
const OPTIONS = { appId: 'SHOPAPP', searchApiKey: 'k', indexName: 'products' }
const real = globalThis.fetch
afterEach(() => (globalThis.fetch = real))

test('an unreachable host: the check names it and ALGOLIA_APP_ID', async () => {
  // what fetch throws for a host that does not answer (undici: a TypeError whose cause has the code)
  globalThis.fetch = async () => {
    throw new TypeError('fetch failed', {
      cause: Object.assign(new Error('connect ECONNREFUSED'), {
        code: 'ECONNREFUSED',
      }),
    })
  }
  await assert.rejects(
    definition.probe(undefined, OPTIONS),
    /^Error: shopapp-dsn\.algolia\.net cannot be reached \(ALGOLIA_APP_ID\): ECONNREFUSED$/
  )
})

test('a refused key names ALGOLIA_SEARCH_API_KEY; the request reads the index with the search key', async () => {
  let seen
  globalThis.fetch = async (url, init) => (
    (seen = { url, init }),
    new Response('', { status: 403 })
  )
  await assert.rejects(
    definition.probe(undefined, OPTIONS),
    /refused the credentials \(ALGOLIA_SEARCH_API_KEY\): HTTP 403/
  )
  assert.equal(
    seen.url,
    'https://SHOPAPP-dsn.algolia.net/1/indexes/products/settings'
  )
  assert.equal(seen.init.headers['X-Algolia-API-Key'], 'k')
})
