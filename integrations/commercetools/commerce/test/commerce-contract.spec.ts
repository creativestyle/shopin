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
import { buildPort, commerceContract } from '@core/integration-kit/testing'
import { commercetools } from '../src/shopin'
import { COMMERCETOOLS_CLIENT } from '@integrations/commercetools-core'
import { UserClientService } from '@integrations/commercetools-core'
import { FakeMeClient, FakeProjectClient } from './fake-client'

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
  "a customer's cart is that customer's",
  'setCartFields',
]

describe('commercetools commerce port: the commerce contract (fake API client)', () => {
  const client = new FakeProjectClient()
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
  const meCalls: string[] = []
  // a guest's anonymous session: its `me` API reads only the carts a test puts here
  const guestCarts = new Set<string>()
  const guest = {
    getClient: async () =>
      new FakeMeClient('anon-token', { carts: guestCarts }, meCalls),
  }
  const port = (as: { customerId?: string } = {}) =>
    buildPort(commercetools({ storeKeys: STORE_KEYS }).ports.commerce(), {
      ...as,
      storefrontUrl: 'https://shop.test',
      options: OPTIONS,
      providers: [
        { provide: COMMERCETOOLS_CLIENT, useValue: client },
        { provide: UserClientService, useValue: guest },
      ],
    })
  const cases = commerceContract(
    (as) =>
      buildPort(commercetools({ storeKeys: STORE_KEYS }).ports.commerce(), {
        ...as,
        storefrontUrl: 'https://shop.test',
        options: OPTIONS,
        providers: [
          { provide: COMMERCETOOLS_CLIENT, useValue: client },
          { provide: UserClientService, useValue: guest },
        ],
      }),
    {
      product: { slug: 'linen-shirt' },
      cart: { fields: { giftMessage: 'contract' } },
      customers: true,
      orders: true,
    }
  ).filter((c) => RUN_HERE.some((name) => c.name.includes(name)))

  it('runs the five cases the fake supports', () => {
    expect(cases).toHaveLength(5)
  })
  for (const c of cases) {
    it(`${c.name}`, c.run)
  }

  it("attachGuestCart, at sign-in through another identity provider: the guest's own cart becomes the customer's while the guest token is there; another customer's is refused", async () => {
    const owner = await (
      await port()
    ).customers!.create(
      {
        subject: 'attach-1',
        email: 'attach-1@example.com',
        emailVerified: true,
      },
      'idp:attach-1'
    )
    const stranger = await (
      await port()
    ).customers!.create(
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
    const record = client.carts_.find((c) => c.id === made.id)!
    delete record.customerId
    guestCarts.add(made.id)

    const mine = await port({ customerId: owner })
    expect((await mine.attachGuestCart!(made.id)).id).toBe(made.id)
    expect(record.customerId).toBe(owner)
    expect(client.cartCalls).toContain(
      `POST carts/${made.id} setCustomerId ${owner}`
    )
    // now the customer's cart: another customer cannot take it
    const theirs = await port({ customerId: stranger })
    await expect(theirs.attachGuestCart!(made.id)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('the order and cart cases went through the project API scoped to each customer, and the guest through me() (reads only)', () => {
    expect(client.cartCalls).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^POST orders from carts\//),
        expect.stringMatching(/^GET orders\/ct-order-/),
      ])
    )
    // the guest only ever reads through me() (and is refused): another customer's order and carts
    expect(meCalls).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^anon-token GET me\/orders\/ct-order-/),
        expect.stringMatching(/^anon-token GET me\/carts\/ct-cart-/),
      ])
    )
    expect(meCalls.every((c) => c.startsWith('anon-token GET me/'))).toBe(true)
  })
})
