/**
 * The commercetools commerce port against the commerce contract suite every commerce integration runs
 * (`@core/integration-kit/testing`), built as the BFF builds it with the API client replaced by the in-memory fake.
 * The fake answers customers, carts with line items and custom fields, Custom Types, orders and product projections
 * by slug, and the guest's `me` API only reads the carts a test gives it. So the shape, customer-linking, order- and
 * cart-ownership and cart-fields cases run here. The kit's attach case creates its guest cart through `me()`, which
 * the fake cannot; `attachGuestCart` is tested below on a guest cart put in place. The navigation, store-config,
 * catalog and guest-cart cases need a recorded or live project: the fake has no categories, store settings or
 * guest `me` cart creation.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPort, commerceContract } from '@core/integration-kit/testing'
import shopin from '../dist/shopin.js'
import core from '@integrations/commercetools-core'
import { FakeMeClient, FakeProjectClient } from './fake-client.mjs'
import storeChannels from '../dist/services/store-channels.service.js'

const { commercetools } = shopin
const { COMMERCETOOLS_CLIENT, UserClientService } = core
const { STORE_CHANNELS } = storeChannels

const OPTIONS = {
  projectKey: 'proj',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://api.fake.invalid',
  authUrl: 'https://auth.fake.invalid',
  linkCustomers: '1',
}

/** A store for every locale the shop has (the port checks at boot that none lacks one). */
const STORE_KEYS = { 'en-US': 'store-en-US' }

/** The cases that run on the fake (see above). */
const RUN_HERE = [
  'every service and method',
  'customers are found',
  "a customer's order is readable",
  'the order made from a cart is found by that cart',
  "a customer's cart is that customer's",
  'setCartFields',
]

describe('commercetools commerce port: the commerce contract (fake API client)', () => {
  const client = new FakeProjectClient()
  // the store of every locale, without a distribution channel (prices by currency and country)
  client.stores_.push({ key: 'store-en-US', distributionChannels: [] })
  // the project's Custom Type for the shop's cart fields (setCartFields gives a cart without a type this one)
  client.types_.push({
    id: 'type-shop',
    key: 'shop-cart-fields',
    fieldDefinitions: [{ name: 'giftMessage' }],
  })
  client.products_.push({
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
  })
  const meCalls = []
  // a guest's anonymous session: its `me` API reads only the carts a test puts here
  const guestCarts = new Set()
  const guest = {
    getClient: async () =>
      new FakeMeClient('anon-token', { carts: guestCarts }, meCalls),
  }
  /** The port as the BFF has it after its start-up check: the stores' distribution channels read. */
  const port = async (as = {}) => {
    const built = await buildPort(
      commercetools({ storeKeys: STORE_KEYS }).ports.commerce(),
      {
        ...as,
        storefrontUrl: 'https://shop.test',
        options: OPTIONS,
        providers: [
          { provide: COMMERCETOOLS_CLIENT, useValue: client },
          { provide: UserClientService, useValue: guest },
        ],
      }
    )
    await built[STORE_CHANNELS].load()
    return built
  }
  const cases = commerceContract((as) => port(as), {
    product: { slug: 'linen-shirt' },
    cart: { fields: { giftMessage: 'contract' } },
    customers: true,
    orders: true,
  }).filter((c) => RUN_HERE.some((name) => c.name.includes(name)))

  it('runs the six cases the fake supports', () => {
    assert.equal(cases.length, 6)
  })
  for (const c of cases) {
    it(`${c.name}`, c.run)
  }

  it("attachGuestCart, at sign-in through another identity provider: the guest's own cart becomes the customer's while the guest token is there; another customer's is refused", async () => {
    const owner = await (
      await port()
    ).customers.create(
      {
        subject: 'attach-1',
        email: 'attach-1@example.com',
        emailVerified: true,
      },
      'idp:attach-1'
    )
    const stranger = await (
      await port()
    ).customers.create(
      {
        subject: 'attach-2',
        email: 'attach-2@example.com',
        emailVerified: true,
      },
      'idp:attach-2'
    )
    // a guest cart: no customer, readable by this shopper's anonymous session
    const made = await (
      await port({ customerId: owner })
    ).cartService.createCart()
    const record = client.carts_.find((c) => c.id === made.id)
    delete record.customerId
    guestCarts.add(made.id)

    const mine = await port({ customerId: owner })
    assert.equal((await mine.attachGuestCart(made.id)).id, made.id)
    assert.equal(record.customerId, owner)
    assert.ok(
      client.cartCalls.includes(`POST carts/${made.id} setCustomerId ${owner}`)
    )
    // now the customer's cart: another customer cannot take it
    const theirs = await port({ customerId: stranger })
    await assert.rejects(theirs.attachGuestCart(made.id), {
      status: 404,
    })
  })

  it('the order and cart cases went through the project API scoped to each customer, and the guest through me() (reads only)', () => {
    const containsMatch = (list, pattern) =>
      assert.ok(
        list.some((c) => pattern.test(c)),
        `no entry matches ${pattern}: ${JSON.stringify(list)}`
      )
    containsMatch(client.cartCalls, /^POST orders from carts\//)
    containsMatch(client.cartCalls, /^GET orders\/ct-order-/)
    // the guest only ever reads through me() (and is refused): another customer's order and carts
    containsMatch(meCalls, /^anon-token GET me\/orders\/ct-order-/)
    containsMatch(meCalls, /^anon-token GET me\/carts\/ct-cart-/)
    assert.equal(
      meCalls.every((c) => c.startsWith('anon-token GET me/')),
      true
    )
  })
})
