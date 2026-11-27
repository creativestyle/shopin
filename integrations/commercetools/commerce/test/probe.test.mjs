/**
 * The credentials check at the BFF's start, as for every vendor: an unreachable auth host or a refused API client is
 * named with the host and the variable to fix (never a bare "fetch failed"); the BFF then marks commerce unavailable.
 * With the credentials good, it reads every configured store's distribution channel for the requests; a store that
 * cannot be read fails the check the same way.
 */
import { describe, it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import commerce from '../dist/parts/commerce.js'
import storeChannels from '../dist/services/store-channels.service.js'
import stores from '../dist/config/stores.js'
import { FakeProjectClient } from './fake-client.mjs'

const { commercePort } = commerce
const { STORE_CHANNELS, StoreChannels } = storeChannels
const { storeKeysFor } = stores

/** The port value the check gets: its stores (`us-store` for en-US, `eu-store` for de-DE) answered by `server`. */
const portOf = (server) => ({
  [STORE_CHANNELS]: new StoreChannels(
    server,
    { getCurrentLanguage: () => 'en-US' },
    storeKeysFor(undefined, { 'en-US': 'us-store', 'de-DE': 'eu-store' }, [
      'en-US',
      'de-DE',
    ])
  ),
})
/** A project with both stores, neither with a distribution channel. */
const withStores = () => {
  const server = new FakeProjectClient()
  server.stores_.push(
    { key: 'us-store', distributionChannels: [] },
    { key: 'eu-store', distributionChannels: [] }
  )
  return server
}

const OPTIONS = {
  projectKey: 'shop-project',
  clientId: 'client',
  clientSecret: 'secret',
  apiUrl: 'https://api.europe-west1.gcp.commercetools.com',
  authUrl: 'https://auth.europe-west1.gcp.commercetools.com',
}
const probe = (server = withStores()) =>
  commercePort().probe(portOf(server), OPTIONS)

describe('commercetools credentials check at start', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })

  it('an unreachable auth host: names it, COMMERCETOOLS_AUTH_URL and ENOTFOUND', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed', {
        cause: Object.assign(new Error('getaddrinfo ENOTFOUND'), {
          code: 'ENOTFOUND',
        }),
      })
    }
    await assert.rejects(probe(), {
      message:
        /^auth\.europe-west1\.gcp\.commercetools\.com cannot be reached \(COMMERCETOOLS_AUTH_URL\): ENOTFOUND$/,
    })
  })

  it("asks the project's anonymous token endpoint with the API client", async () => {
    let asked
    globalThis.fetch = async (url, init) => {
      asked = [url, init]
      return new Response('{}', { status: 200 })
    }
    await probe()
    assert.equal(
      asked[0],
      'https://auth.europe-west1.gcp.commercetools.com/oauth/shop-project/anonymous/token'
    )
    assert.equal(
      new Headers(asked[1].headers).get('authorization'),
      `Basic ${Buffer.from('client:secret').toString('base64')}`
    )
  })

  it('a refused API client names COMMERCETOOLS_CLIENT_ID and COMMERCETOOLS_CLIENT_SECRET', async () => {
    globalThis.fetch = async () => new Response('', { status: 401 })
    await assert.rejects(probe(), {
      message:
        /refused the credentials \(COMMERCETOOLS_CLIENT_ID, COMMERCETOOLS_CLIENT_SECRET\): HTTP 401/,
    })
  })
})

describe('commercetools API client scopes at start, with customer linking on', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })
  const probeLinking = () =>
    commercePort().probe(portOf(withStores()), {
      ...OPTIONS,
      linkCustomers: '1',
    })
  const answering =
    (scope, urls = []) =>
    async (url) => {
      urls.push(url)
      return new Response(JSON.stringify({ scope }), { status: 200 })
    }

  it('without linking, only the credentials check runs: shopper scopes suffice', async () => {
    const urls = []
    globalThis.fetch = answering('view_published_products:shop-project', urls)
    await probe()
    assert.deepEqual(urls, [
      'https://auth.europe-west1.gcp.commercetools.com/oauth/shop-project/anonymous/token',
    ])
  })

  it('with linking and every project scope granted, the BFF starts', async () => {
    globalThis.fetch = answering(
      'manage_orders:shop-project manage_customers:shop-project manage_payments:shop-project manage_shopping_lists:shop-project view_published_products:shop-project'
    )
    assert.equal(await probeLinking(), undefined)
  })

  it('an admin client (manage_project) has every scope: the BFF starts', async () => {
    globalThis.fetch = answering('manage_project:shop-project')
    assert.equal(await probeLinking(), undefined)
  })

  it('a refused token request is named as such, not as missing scopes', async () => {
    globalThis.fetch = async (url) =>
      url.endsWith('/anonymous/token')
        ? new Response('{}', { status: 200 })
        : new Response('{"error":"invalid_client"}', {
            status: 401,
          })
    await assert.rejects(probeLinking(), {
      message: /scopes could not be read \(token request answered 401\)/,
    })
  })

  it('with linking and shopper scopes only, the BFF stops and names the missing scopes', async () => {
    globalThis.fetch = answering(
      'view_orders:shop-project view_published_products:shop-project manage_my_orders:shop-project'
    )
    await assert.rejects(probeLinking(), {
      message:
        /lacks the scopes: manage_orders, manage_customers, manage_payments, manage_shopping_lists\./,
    })
  })
})

describe('commercetools store channels at start', () => {
  const real = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = real
  })

  it('with the credentials good, every configured store is read once', async () => {
    globalThis.fetch = async () => new Response('{}', { status: 200 })
    const server = withStores()
    await probe(server)
    assert.deepEqual(server.storeCalls.toSorted(), [
      'GET stores/key=eu-store',
      'GET stores/key=us-store',
    ])
  })

  it('a store that cannot be read fails the check, naming the store and where its key is set', async () => {
    globalThis.fetch = async () => new Response('{}', { status: 200 })
    const server = new FakeProjectClient()
    server.stores_.push({ key: 'us-store', distributionChannels: [] })
    await assert.rejects(probe(server), {
      message:
        /^commercetools Store "eu-store" cannot be read \(commercetools\(\{ storeKeys \}\) or COMMERCETOOLS_STORE_KEYS\): HTTP 404$/,
    })
  })

  it('refused credentials: no store is read', async () => {
    globalThis.fetch = async () => new Response('', { status: 401 })
    const server = withStores()
    await assert.rejects(probe(server))
    assert.deepEqual(server.storeCalls, [])
  })
})
