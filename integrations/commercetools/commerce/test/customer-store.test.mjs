/**
 * The commerce port's customer store: the lookups and writes the BFF's linking policy asks commercetools
 * for (Customer.externalId = `<provider>:<subject>`, customers of external identity providers created with
 * `authenticationMode: ExternalAuth`), and the guard that refuses every write unless
 * COMMERCETOOLS_LINK_CUSTOMERS=1. Built through the commerce port's own Nest providers, with the API
 * client replaced by an in-memory fake.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { format } from 'node:util'
import { Test } from '@nestjs/testing'
import kit from '@core/integration-kit'
import core from '@integrations/commercetools-core'
import shopin from '../dist/shopin.js'
import customerStoreService from '../dist/services/customer-store.service.js'
import { FakeProjectClient } from './fake-client.mjs'

const { CustomerContext, PortOptions, RequestContext, TokenVault } = kit
const { COMMERCETOOLS_CLIENT } = core
const { commercetools } = shopin
const { CommercetoolsCustomerStore } = customerStoreService

const OPTIONS = {
  projectKey: 'proj',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://api.fake.invalid',
  authUrl: 'https://auth.fake.invalid',
}

const PORT = Symbol('commercetools commerce port')

/** The commerce port as the BFF builds it: its providers, its options, a vault, a customer context. */
async function commercePort(client, options) {
  return (await commerceModule(client, options)).get(PORT)
}

async function commerceModule(client, options) {
  // a store for every locale the shop has (the port checks at boot that none lacks one)
  const storeKeys = { 'en-US': 'store-en-US', 'de-DE': 'store-de-DE' }
  const definition = commercetools({ storeKeys }).ports.commerce()
  assert.equal(definition.category, 'commerce')
  const module = await Test.createTestingModule({
    providers: [
      ...definition.providers,
      { provide: PortOptions, useValue: Object.freeze({ ...options }) },
      {
        provide: TokenVault,
        useValue: {
          get: async () => undefined,
          set: async () => {},
          clear: () => {},
        },
      },
      {
        provide: CustomerContext,
        useValue: { customerId: async () => undefined },
      },
      // the BFF provides it globally; building the port reads only the shop's locales (a store per locale)
      { provide: RequestContext, useValue: { locales: ['en-US', 'de-DE'] } },
      {
        provide: PORT,
        inject: definition.inject ?? [],
        useFactory: definition.useFactory,
      },
    ],
  })
    .overrideProvider(COMMERCETOOLS_CLIENT)
    .useValue(client)
    .compile()
  return module
}

const identity = (email, name) => ({
  subject: `idp|${email}`,
  email,
  emailVerified: true,
  ...(name ? { name } : {}),
})

describe('commercetools customer store (linking)', () => {
  let ct
  let store
  beforeEach(async () => {
    ct = new FakeProjectClient()
    const port = await commercePort(ct, { ...OPTIONS, linkCustomers: '1' })
    if (!port.customers) {
      throw new Error(
        'with COMMERCETOOLS_LINK_CUSTOMERS=1 the port supplies customers'
      )
    }
    store = port.customers
  })

  it('with COMMERCETOOLS_LINK_CUSTOMERS=1 the port supplies the customer lookups', async () => {
    const port = await commercePort(new FakeProjectClient(), {
      ...OPTIONS,
      linkCustomers: '1',
    })
    assert.notEqual(port.customers, undefined)
  })

  it('finds a customer by external id with one query, quoting the predicate', async () => {
    ct.customers_.push({
      id: 'ct-1',
      version: 1,
      email: 'a@example.com',
      externalId: 'auth0:idp|"a"',
      authenticationMode: 'ExternalAuth',
    })
    assert.deepEqual(await store.findByExternalId('auth0:idp|"a"'), {
      id: 'ct-1',
      externalId: 'auth0:idp|"a"',
      hasPassword: false,
    })
    assert.deepEqual(ct.calls, [
      'GET customers where externalId="auth0:idp|\\"a\\""',
    ])
    assert.equal(await store.findByExternalId('auth0:nobody'), undefined)
  })

  it('finds by lower-cased e-mail; a Password customer has a password, an ExternalAuth one has none', async () => {
    ct.customers_.push(
      {
        id: 'ct-carol',
        version: 3,
        email: 'carol@example.com',
        authenticationMode: 'Password',
      },
      {
        id: 'ct-erin',
        version: 1,
        email: 'erin@example.com',
        authenticationMode: 'ExternalAuth',
      }
    )
    assert.deepEqual(await store.findByEmail('Carol@Example.com'), {
      id: 'ct-carol',
      hasPassword: true,
    })
    assert.deepEqual(await store.findByEmail('erin@example.com'), {
      id: 'ct-erin',
      hasPassword: false,
    })
    assert.deepEqual(ct.calls, [
      'GET customers where lowercaseEmail="carol@example.com"',
      'GET customers where lowercaseEmail="erin@example.com"',
    ])
  })

  it('creates an ExternalAuth customer with the external id, a verified e-mail and the split name', async () => {
    const id = await store.create(
      identity('alice@example.com', 'Alice van Verified'),
      'auth0:idp|alice'
    )
    assert.equal(id, 'ct-customer-1')
    assert.deepEqual(ct.calls, [
      'POST customers ExternalAuth externalId=auth0:idp|alice',
    ])
    assert.deepEqual(ct.customers_[0], {
      id: 'ct-customer-1',
      version: 1,
      email: 'alice@example.com',
      externalId: 'auth0:idp|alice',
      authenticationMode: 'ExternalAuth',
      isEmailVerified: true,
      firstName: 'Alice',
      lastName: 'van Verified',
    })
  })

  it('sets the external id on the current version of an existing customer', async () => {
    ct.customers_.push({
      id: 'ct-erin',
      version: 4,
      email: 'erin@example.com',
      authenticationMode: 'ExternalAuth',
    })
    await store.setExternalId('ct-erin', 'auth0:idp|erin')
    assert.deepEqual(ct.calls, [
      'GET customers/ct-erin',
      'POST customers/ct-erin v4 setExternalId auth0:idp|erin',
    ])
    assert.equal(ct.customers_[0].externalId, 'auth0:idp|erin')
  })
})

describe('commercetools customer store without COMMERCETOOLS_LINK_CUSTOMERS=1', () => {
  for (const linkCustomers of [undefined, '0', 'true']) {
    it(
      format(
        'linkCustomers=%s: the commerce port offers no customer store (so the BFF refuses sign-in through another provider at boot)',
        linkCustomers
      ),
      async () => {
        const port = await commercePort(new FakeProjectClient(), {
          ...OPTIONS,
          linkCustomers,
        })
        assert.equal(port.customers, undefined)
        assert.equal(typeof port.guestSession.createGuestSession, 'function')
      }
    )
  }

  for (const linkCustomers of [undefined, '0', 'true']) {
    it(
      format(
        'linkCustomers=%s: the store itself still refuses every write before any call',
        linkCustomers
      ),
      async () => {
        const ct = new FakeProjectClient()
        ct.customers_.push({
          id: 'ct-erin',
          version: 1,
          email: 'erin@example.com',
        })
        const store = (
          await commerceModule(ct, { ...OPTIONS, linkCustomers })
        ).get(CommercetoolsCustomerStore)
        assert.equal(
          (await store.findByEmail('erin@example.com'))?.id,
          'ct-erin'
        )
        ct.calls.length = 0
        await assert.rejects(
          store.create(identity('alice@example.com'), 'auth0:idp|alice'),
          (e) =>
            e instanceof Error &&
            e.message.includes('set COMMERCETOOLS_LINK_CUSTOMERS=1 to allow it')
        )
        await assert.rejects(store.setExternalId('ct-erin', 'auth0:idp|erin'), {
          status: 501,
        })
        assert.deepEqual(ct.calls, [])
        assert.equal(ct.customers_.length, 1)
        assert.equal(ct.customers_[0].externalId, undefined)
      }
    )
  }
})

describe('commercetools descriptor', () => {
  it('declares the link switch and the store keys as commerce variables some shops need, with why; not read by the auth part', () => {
    const { env, requires } = commercetools()
    const link = env.commerce.linkCustomers
    assert.equal(link.env, 'COMMERCETOOLS_LINK_CUSTOMERS')
    assert.equal(link.optional, true)
    // needed, with why, when sign-in is another integration's; not with commercetools' own sign-in
    const shop = (auth) => ({
      locales: ['en-US'],
      providers: { auth },
    })
    assert.match(
      link.requiredWhen(shop(['mock-identity'])),
      /sign-in is through "mock-identity".*set it to 1/
    )
    assert.equal(link.requiredWhen(shop(['commercetools'])), undefined)
    // a store per locale: needed unless the factory option names one for every locale
    const stores = env.commerce.storeKeys
    assert.match(stores.requiredWhen(shop([])), /no storeKeys option for en-US/)
    assert.equal(
      commercetools({
        storeKeys: { 'en-US': 'us' },
      }).env.commerce.storeKeys.requiredWhen(shop([])),
      undefined
    )
    // its sign-in is the auth part (integrations/commercetools/auth, its own descriptor test): no requirement here
    assert.equal(requires, undefined)
    assert.deepEqual(Object.keys(env), ['commerce'])
  })

  it('the commerce port supplies the customer store (with linking allowed) and the guest session', async () => {
    const port = await commercePort(new FakeProjectClient(), {
      ...OPTIONS,
      linkCustomers: '1',
    })
    assert.equal(typeof port.customers.findByExternalId, 'function')
    assert.equal(typeof port.guestSession.createGuestSession, 'function')
    assert.equal(typeof port.guestSession.refresh, 'function')
  })
})

describe('commercetools customer store: two customers for one sign-in', () => {
  it('two matches are a conflict, never an arbitrary pick', async () => {
    const ct = new FakeProjectClient()
    ct.customers_.push(
      { id: 'ct-a', version: 1, email: 'twin@example.com' },
      { id: 'ct-b', version: 1, email: 'twin@example.com' }
    )
    const port = await commercePort(ct, { ...OPTIONS, linkCustomers: '1' })
    await assert.rejects(port.customers.findByEmail('twin@example.com'), {
      status: 409,
    })
  })
})
