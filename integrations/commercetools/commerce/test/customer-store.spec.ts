/**
 * The commerce port's customer store: the lookups and writes the BFF's linking policy asks commercetools
 * for (Customer.externalId = `<provider>:<subject>`, customers of external identity providers created with
 * `authenticationMode: ExternalAuth`), and the guard that refuses every write unless
 * COMMERCETOOLS_LINK_CUSTOMERS=1. Built through the commerce port's own Nest providers, with the API
 * client replaced by an in-memory fake.
 */
import { Test } from '@nestjs/testing'
import {
  CustomerContext,
  PortOptions,
  RequestContext,
  TokenVault,
  type Port,
} from '@core/integration-kit'
import { commercetools } from '../src/shopin'
import { COMMERCETOOLS_CLIENT } from '@integrations/commercetools-core'
import { FakeProjectClient } from './fake-client'

type CustomerStore = NonNullable<Port<'commerce'>['customers']>
import { CommercetoolsCustomerStore } from '../src/services/customer-store.service'

const OPTIONS = {
  projectKey: 'proj',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://api.fake.invalid',
  authUrl: 'https://auth.fake.invalid',
}

const PORT = Symbol('commercetools commerce port')

/** The commerce port as the BFF builds it: its providers, its options, a vault, a customer context. */
async function commercePort(
  client: FakeProjectClient,
  options: Record<string, string | undefined>
): Promise<Port<'commerce'>> {
  return (await commerceModule(client, options)).get(PORT)
}

async function commerceModule(
  client: FakeProjectClient,
  options: Record<string, string | undefined>
) {
  // a store for every locale the shop has (the port checks at boot that none lacks one)
  const storeKeys = { 'en-US': 'store-en-US', 'de-DE': 'store-de-DE' }
  const definition = commercetools({ storeKeys }).ports.commerce()
  expect(definition.category).toBe('commerce')
  const module = await Test.createTestingModule({
    providers: [
      ...(definition.providers as never[]),
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
        inject: (definition.inject ?? []) as never[],
        useFactory: definition.useFactory,
      },
    ],
  })
    .overrideProvider(COMMERCETOOLS_CLIENT)
    .useValue(client)
    .compile()
  return module
}

const identity = (email: string, name?: string) => ({
  subject: `idp|${email}`,
  email,
  emailVerified: true,
  ...(name ? { name } : {}),
})

describe('commercetools customer store (linking)', () => {
  let ct: FakeProjectClient
  let store: CustomerStore
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
    expect(port.customers).toBeDefined()
  })

  it('finds a customer by external id with one query, quoting the predicate', async () => {
    ct.customers_.push({
      id: 'ct-1',
      version: 1,
      email: 'a@example.com',
      externalId: 'auth0:idp|"a"',
      authenticationMode: 'ExternalAuth',
    })
    expect(await store.findByExternalId('auth0:idp|"a"')).toEqual({
      id: 'ct-1',
      externalId: 'auth0:idp|"a"',
      hasPassword: false,
    })
    expect(ct.calls).toEqual([
      'GET customers where externalId="auth0:idp|\\"a\\""',
    ])
    expect(await store.findByExternalId('auth0:nobody')).toBeUndefined()
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
    expect(await store.findByEmail('Carol@Example.com')).toEqual({
      id: 'ct-carol',
      hasPassword: true,
    })
    expect(await store.findByEmail('erin@example.com')).toEqual({
      id: 'ct-erin',
      hasPassword: false,
    })
    expect(ct.calls).toEqual([
      'GET customers where lowercaseEmail="carol@example.com"',
      'GET customers where lowercaseEmail="erin@example.com"',
    ])
  })

  it('creates an ExternalAuth customer with the external id, a verified e-mail and the split name', async () => {
    const id = await store.create(
      identity('alice@example.com', 'Alice van Verified'),
      'auth0:idp|alice'
    )
    expect(id).toBe('ct-customer-1')
    expect(ct.calls).toEqual([
      'POST customers ExternalAuth externalId=auth0:idp|alice',
    ])
    expect(ct.customers_[0]).toEqual({
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
    expect(ct.calls).toEqual([
      'GET customers/ct-erin',
      'POST customers/ct-erin v4 setExternalId auth0:idp|erin',
    ])
    expect(ct.customers_[0]!.externalId).toBe('auth0:idp|erin')
  })
})

describe('commercetools customer store without COMMERCETOOLS_LINK_CUSTOMERS=1', () => {
  it.each([undefined, '0', 'true'])(
    'linkCustomers=%s: the commerce port offers no customer store (so the BFF refuses sign-in through another provider at boot)',
    async (linkCustomers) => {
      const port = await commercePort(new FakeProjectClient(), {
        ...OPTIONS,
        linkCustomers,
      })
      expect(port.customers).toBeUndefined()
      expect(typeof port.guestSession!.createGuestSession).toBe('function')
    }
  )

  it.each([undefined, '0', 'true'])(
    'linkCustomers=%s: the store itself still refuses every write before any call',
    async (linkCustomers) => {
      const ct = new FakeProjectClient()
      ct.customers_.push({
        id: 'ct-erin',
        version: 1,
        email: 'erin@example.com',
      })
      const store = (
        await commerceModule(ct, { ...OPTIONS, linkCustomers })
      ).get(CommercetoolsCustomerStore)
      expect(await store.findByEmail('erin@example.com')).toMatchObject({
        id: 'ct-erin',
      })
      ct.calls.length = 0
      await expect(
        store.create(identity('alice@example.com'), 'auth0:idp|alice')
      ).rejects.toThrow('set COMMERCETOOLS_LINK_CUSTOMERS=1 to allow it')
      await expect(
        store.setExternalId('ct-erin', 'auth0:idp|erin')
      ).rejects.toMatchObject({ status: 501 })
      expect(ct.calls).toEqual([])
      expect(ct.customers_).toHaveLength(1)
      expect(ct.customers_[0]!.externalId).toBeUndefined()
    }
  )
})

describe('commercetools descriptor', () => {
  it('declares the link switch and the store keys as commerce variables some shops need, with why; not read by the auth part', () => {
    const { env, requires } = commercetools()
    const link = env!.commerce!.linkCustomers!
    expect(link).toMatchObject({
      env: 'COMMERCETOOLS_LINK_CUSTOMERS',
      optional: true,
    })
    // needed, with why, when sign-in is another integration's; not with commercetools' own sign-in
    const shop = (auth: string[]) => ({
      locales: ['en-US'],
      providers: { auth },
    })
    expect(link.requiredWhen!(shop(['mock-identity']))).toMatch(
      /sign-in is through "mock-identity".*set it to 1/
    )
    expect(link.requiredWhen!(shop(['commercetools']))).toBeUndefined()
    // a store per locale: needed unless the factory option names one for every locale
    const stores = env!.commerce!.storeKeys!
    expect(stores.requiredWhen!(shop([]))).toMatch(
      /no storeKeys option for en-US/
    )
    expect(
      commercetools({ storeKeys: { 'en-US': 'us' } }).env!.commerce!.storeKeys!
        .requiredWhen!(shop([]))
    ).toBeUndefined()
    // its sign-in is the auth part (integrations/commercetools/auth, its own descriptor test): no requirement here
    expect(requires).toBeUndefined()
    expect(Object.keys(env!)).toEqual(['commerce'])
  })

  it('the commerce port supplies the customer store (with linking allowed) and the guest session', async () => {
    const port = await commercePort(new FakeProjectClient(), {
      ...OPTIONS,
      linkCustomers: '1',
    })
    expect(typeof port.customers!.findByExternalId).toBe('function')
    expect(typeof port.guestSession!.createGuestSession).toBe('function')
    expect(typeof port.guestSession!.refresh).toBe('function')
  })
})
