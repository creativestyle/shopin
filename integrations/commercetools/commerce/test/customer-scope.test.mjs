/**
 * Who the commerce port acts for. A customer linked through another identity provider has no commercetools
 * password token, so the port acts through the project API scoped to that customer: every read and write
 * names the customer, a guest cart is taken over only when the shopper's own anonymous session owns it, and
 * any other cart answers 404. A guest acts through `me()` with the anonymous token.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import customerScope from '../dist/shared/customer-scope.service.js'
import { buildPort } from '@core/integration-kit/testing'
import { TokenVault } from '@core/integration-kit'
import shopin from '../dist/shopin.js'
import core from '@integrations/commercetools-core'
import { FakeMeClient, FakeProjectClient } from './fake-client.mjs'

const { CustomerScope } = customerScope
const { commercetools } = shopin
const { COMMERCETOOLS_CLIENT, UserClientService } = core

/** `customerToken`: the vault holds the customer's own commercetools token (commercetools' own sign-in). */
function scope(customerId, customerToken = false) {
  const server = new FakeProjectClient()
  const meCalls = []
  const guestCarts = new Set()
  // the anonymous session in this port's vault entry (UserClientService reads it)
  const user = {
    getClient: async () =>
      new FakeMeClient(
        customerToken ? 'customer-token' : 'anon-token',
        { carts: guestCarts },
        meCalls
      ),
  }
  const context = { customerId: async () => customerId }
  const vault = {
    get: async () =>
      customerToken
        ? {
            accessToken: 'customer-token',
            refreshToken: 'r',
            expiresIn: 1,
            customer: true,
          }
        : undefined,
  }
  return {
    server,
    meCalls,
    guestCarts,
    scope: new CustomerScope(server, user, vault, context),
  }
}

describe('commercetools CustomerScope for a linked customer', () => {
  it('reads and writes through the project API, scoped to the linked customer', async () => {
    const { server, meCalls, scope: s } = scope('ct-customer-1')
    server.customers_.push({
      id: 'ct-customer-1',
      version: 1,
      email: 'alice@example.com',
      authenticationMode: 'ExternalAuth',
    })
    assert.equal(await s.customerId(), 'ct-customer-1')
    const api = await s.api()
    assert.equal((await api.customer.get()).id, 'ct-customer-1')
    assert.equal(
      (await api.carts.create({ currency: 'USD' })).customerId,
      'ct-customer-1'
    )
    await api.carts.query({ where: 'cartState="Active"' })
    assert.deepEqual(server.calls, ['GET customers/ct-customer-1'])
    assert.deepEqual(server.cartCalls, [
      'POST carts customerId=ct-customer-1',
      'GET carts where customerId="ct-customer-1" and cartState="Active"',
    ])
    // no me() call: the customer's data never goes through an anonymous token
    assert.deepEqual(meCalls, [])
    // and the client for non-shopper calls is the project client
    assert.equal(await s.client(), server)
  })

  it('takes over the shopper’s own guest cart; a stranger’s guest cart and another customer’s cart are 404', async () => {
    const { server, meCalls, guestCarts, scope: s } = scope('ct-customer-1')
    server.carts_.push(
      { id: 'ct-guest-cart-1', version: 1 },
      { id: 'ct-guest-cart-other', version: 1 },
      {
        id: 'ct-cart-of-someone-else',
        version: 1,
        customerId: 'ct-customer-99',
      }
    )
    guestCarts.add('ct-guest-cart-1')
    const api = await s.api()
    assert.equal(
      (await api.carts.get('ct-guest-cart-1')).customerId,
      'ct-customer-1'
    )
    await assert.rejects(api.carts.get('ct-guest-cart-other'), {
      status: 404,
    })
    await assert.rejects(api.carts.get('ct-cart-of-someone-else'), {
      status: 404,
    })
    await assert.rejects(api.carts.get('ct-missing'), {
      status: 404,
    })
    assert.ok(
      server.cartCalls.includes(
        'POST carts/ct-guest-cart-1 setCustomerId ct-customer-1'
      )
    )
    assert.deepEqual(
      server.cartCalls.filter((c) => c.startsWith('POST carts/')),
      ['POST carts/ct-guest-cart-1 setCustomerId ct-customer-1']
    )
    assert.equal(
      server.carts_.find((c) => c.id === 'ct-guest-cart-other').customerId,
      undefined
    )
    assert.equal(
      server.carts_.find((c) => c.id === 'ct-cart-of-someone-else').customerId,
      'ct-customer-99'
    )
    // the only me() calls are the ownership probes of guest carts (anonymous token)
    assert.deepEqual(meCalls, [
      'anon-token GET me/carts/ct-guest-cart-1',
      'anon-token GET me/carts/ct-guest-cart-other',
    ])
  })

  it('an update of a cart that is not the customer’s is refused before any write', async () => {
    const { server, scope: s } = scope('ct-customer-1')
    server.carts_.push({
      id: 'ct-cart-of-someone-else',
      version: 1,
      customerId: 'ct-customer-99',
    })
    const api = await s.api()
    await assert.rejects(
      api.carts.update('ct-cart-of-someone-else', 1, [
        { action: 'setCustomerId', customerId: 'ct-customer-1' },
      ]),
      { status: 404 }
    )
    assert.deepEqual(server.cartCalls, ['GET carts/ct-cart-of-someone-else'])
  })
})

describe('commercetools CustomerScope for a guest', () => {
  it('acts through me() with the anonymous session, never the project API', async () => {
    const { server, meCalls, guestCarts, scope: s } = scope(undefined)
    guestCarts.add('ct-guest-cart-1')
    assert.equal(await s.customerId(), undefined)
    const api = await s.api()
    assert.equal((await api.carts.get('ct-guest-cart-1')).id, 'ct-guest-cart-1')
    await assert.rejects(api.carts.get('ct-guest-cart-other'), {
      status: 404,
    })
    assert.deepEqual(meCalls, [
      'anon-token GET me/carts/ct-guest-cart-1',
      'anon-token GET me/carts/ct-guest-cart-other',
    ])
    assert.deepEqual(server.calls, [])
    assert.deepEqual(server.cartCalls, [])
  })
})

describe('commercetools CustomerScope for a customer of commercetools sign-in', () => {
  it("acts through me() with the customer's own token, never the project API (shopper scopes suffice)", async () => {
    const {
      server,
      meCalls,
      guestCarts,
      scope: s,
    } = scope('ct-customer-1', true)
    guestCarts.add('ct-customer-cart-1')
    assert.equal(await s.customerId(), 'ct-customer-1')
    const api = await s.api()
    assert.equal(
      (await api.carts.get('ct-customer-cart-1')).id,
      'ct-customer-cart-1'
    )
    await assert.rejects(api.orders.get('ct-order-1'), {
      status: 404,
    })
    assert.deepEqual(meCalls, [
      'customer-token GET me/carts/ct-customer-cart-1',
      'customer-token GET me/orders/ct-order-1',
    ])
    assert.deepEqual(server.calls, [])
    assert.deepEqual(server.cartCalls, [])
    // non-shopper calls (catalog, shipping methods) use the customer's client too, not the project client
    assert.notEqual(await s.client(), server)
  })
})

describe('commercetools CustomerScope: taking a guest cart over', () => {
  function withGuest(fail) {
    const server = new FakeProjectClient()
    server.carts_.push({ id: 'ct-guest-cart-9', version: 1 })
    const user = {
      getClient: async () => ({
        me: () => ({
          carts: () => ({
            withId: () => ({
              get: () => ({
                execute: async () => {
                  throw fail
                },
              }),
            }),
          }),
        }),
      }),
    }
    const vault = { get: async () => undefined }
    const context = { customerId: async () => 'ct-customer-1' }
    return {
      server,
      scope: new CustomerScope(server, user, vault, context),
    }
  }

  it('an expired guest token or an outage is passed on, not read as "not this shopper\'s cart" (the cart is not lost)', async () => {
    for (const fail of [
      Object.assign(new Error('expired'), { statusCode: 401 }),
      Object.assign(new Error('down'), { statusCode: 503 }),
    ]) {
      const { server, scope: s } = withGuest(fail)
      await assert.rejects(
        (await s.api()).carts.get('ct-guest-cart-9'),
        (e) => {
          // the very error, not a copy
          assert.equal(e, fail)
          return true
        }
      )
      assert.deepEqual(
        server.cartCalls.filter((c) => c.startsWith('POST')),
        []
      )
    }
  })

  it('an ordered cart is never handed to a customer, even when the guest can read it', async () => {
    const { server, guestCarts, scope: s } = scope('ct-customer-1')
    server.carts_.push({ id: 'ct-ordered', version: 3, cartState: 'Ordered' })
    guestCarts.add('ct-ordered')
    await assert.rejects((await s.api()).carts.get('ct-ordered'), {
      status: 404,
    })
    assert.deepEqual(
      server.cartCalls.filter((c) => c.startsWith('POST')),
      []
    )
  })
})

/**
 * The guardrail for swapping sign-in to another identity provider (Auth0, any OIDC): the commerce port as the BFF
 * builds it, with a signed-in shopper whose SHOPin session names a linked commercetools customer and whose vault
 * holds no commercetools customer token. Cart, order and wishlist work goes through the project API scoped to that
 * customer and never through `me()`; with commercetools' own customer token in the vault, the same calls use `me()`.
 * The start-up check of the scopes this needs: probe.test.mjs.
 */
describe('commercetools commerce port with sign-in by another identity provider', () => {
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

  /**
   * The port for customer `ct-customer-1` with one cart of theirs. `customerToken`: the vault holds their own
   * commercetools token (commercetools sign-in); otherwise it is empty (another identity provider).
   */
  async function port(customerToken) {
    const server = new FakeProjectClient()
    // what the customer owns at commercetools, reachable through me() only with their own token
    const own = new FakeProjectClient()
    for (const p of [server, own]) {
      p.products_.push(PRODUCT)
      p.carts_.push({
        id: 'ct-cart-1',
        version: 1,
        customerId: 'ct-customer-1',
        currency: 'USD',
        lineItems: [],
        totalPrice: { centAmount: 0, currencyCode: 'USD' },
      })
    }
    const meCalls = []
    const owned = {
      carts: new Set(customerToken ? ['ct-cart-1'] : []),
      data: own,
    }
    const user = {
      getClient: async () =>
        new FakeMeClient(
          customerToken ? 'customer-token' : 'anon-token',
          owned,
          meCalls
        ),
    }
    const providers = [
      { provide: COMMERCETOOLS_CLIENT, useValue: server },
      { provide: UserClientService, useValue: user },
    ]
    if (customerToken) {
      providers.push({
        provide: TokenVault,
        useValue: {
          get: async () => ({
            accessToken: 'customer-token',
            refreshToken: 'r',
            expiresIn: 1,
            customer: true,
          }),
        },
      })
    }
    const commerce = await buildPort(
      commercetools({ storeKeys: { 'en-US': 'store-en-US' } }).ports.commerce(),
      {
        storefrontUrl: 'https://shop.test',
        options: OPTIONS,
        customerId: 'ct-customer-1',
        providers,
      }
    )
    return { commerce, server, meCalls }
  }

  /** Cart read and update, order create and read, wishlist create, add and read: the shopper's own data. */
  async function shop(commerce) {
    await commerce.cartService.getCart('ct-cart-1')
    await commerce.cartService.addToCart('ct-cart-1', 'ct-product-1')
    const order = await commerce.orderService.createOrder({
      cartId: 'ct-cart-1',
    })
    assert.equal((await commerce.orderService.getOrder(order.id)).id, order.id)
    const list = await commerce.wishlistService.getOrCreateWishlist()
    await commerce.wishlistService.addToWishlist(list.id, {
      productId: 'ct-product-1',
    })
    const read = await commerce.wishlistService.getWishlist(list.id)
    assert.equal(read.items.length, 1)
    return { order, list }
  }

  it('without a commercetools token: the project API, scoped to the linked customer, never me()', async () => {
    const { commerce, server, meCalls } = await port(false)
    const { order, list } = await shop(commerce)
    assert.deepEqual(server.cartCalls, [
      // read: by id, then checked to be this customer's
      'GET carts/ct-cart-1',
      // update: the ownership check, then the write
      'GET carts/ct-cart-1',
      'GET carts/ct-cart-1',
      'POST carts/ct-cart-1 addLineItem ct-product-1',
      // order: the cart is checked before the order is made from it, and the order read is checked after
      'GET carts/ct-cart-1',
      'GET carts/ct-cart-1',
      'POST orders from carts/ct-cart-1',
      `GET orders/${order.id}`,
    ])
    assert.equal(server.orders_[0].customerId, 'ct-customer-1')
    assert.deepEqual(server.listCalls, [
      'GET shopping-lists where customer(id="ct-customer-1")',
      'POST shopping-lists customer=ct-customer-1',
      `GET shopping-lists/${list.id}`,
      `GET shopping-lists/${list.id}`,
      `POST shopping-lists/${list.id} addLineItem ct-product-1`,
      `GET shopping-lists/${list.id}`,
    ])
    assert.equal(server.lists_[0].customer.id, 'ct-customer-1')
    // the guest token in the vault is never used for the customer's data
    assert.deepEqual(meCalls, [])
  })

  it('without a commercetools token: another customer’s cart, order and wishlist answer 404 through the port', async () => {
    const { commerce, server, meCalls } = await port(false)
    server.carts_.push({ id: 'ct-cart-x', version: 1, customerId: 'ct-x' })
    server.orders_.push({ id: 'ct-order-x', version: 1, customerId: 'ct-x' })
    server.lists_.push({
      id: 'ct-list-x',
      version: 1,
      customer: { id: 'ct-x' },
      lineItems: [],
    })
    await assert.rejects(commerce.cartService.getCart('ct-cart-x'), {
      status: 404,
    })
    await assert.rejects(
      commerce.cartService.addToCart('ct-cart-x', 'ct-product-1'),
      { status: 404 }
    )
    await assert.rejects(
      commerce.orderService.createOrder({ cartId: 'ct-cart-x' }),
      { status: 404 }
    )
    await assert.rejects(commerce.orderService.getOrder('ct-order-x'), {
      status: 404,
    })
    await assert.rejects(commerce.wishlistService.getWishlist('ct-list-x'), {
      status: 404,
    })
    assert.equal(
      server.cartCalls.some((c) => c.startsWith('POST')),
      false
    )
    assert.deepEqual(meCalls, [])
  })

  it("with the customer's own commercetools token: me(), never the project API", async () => {
    const { commerce, server, meCalls } = await port(true)
    const { order, list } = await shop(commerce)
    assert.deepEqual(server.cartCalls, [])
    assert.deepEqual(server.listCalls, [])
    assert.deepEqual(server.calls, [])
    assert.deepEqual(meCalls, [
      'customer-token GET me/carts/ct-cart-1',
      'customer-token GET me/carts/ct-cart-1',
      'customer-token POST me/carts/ct-cart-1 addLineItem',
      'customer-token GET me/carts/ct-cart-1',
      'customer-token POST me/orders from carts/ct-cart-1',
      `customer-token GET me/orders/${order.id}`,
      'customer-token GET me/shopping-lists',
      'customer-token POST me/shopping-lists',
      `customer-token GET me/shopping-lists/${list.id}`,
      `customer-token POST me/shopping-lists/${list.id} addLineItem`,
      'customer-token GET product-projections',
      `customer-token GET me/shopping-lists/${list.id}`,
      'customer-token GET product-projections',
    ])
  })
})
