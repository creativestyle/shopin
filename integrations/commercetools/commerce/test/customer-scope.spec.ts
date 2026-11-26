/**
 * Who the commerce port acts for. A customer linked through another identity provider has no commercetools
 * password token, so the port acts through the project API scoped to that customer: every read and write
 * names the customer, a guest cart is taken over only when the shopper's own anonymous session owns it, and
 * any other cart answers 404. A guest acts through `me()` with the anonymous token.
 */
import { CustomerScope } from '../src/shared/customer-scope.service'
import { FakeMeClient, FakeProjectClient } from './fake-client'

/** `customerToken`: the vault holds the customer's own commercetools token (commercetools' own sign-in). */
function scope(customerId: string | undefined, customerToken = false) {
  const server = new FakeProjectClient()
  const meCalls: string[] = []
  const guestCarts = new Set<string>()
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
    scope: new CustomerScope(
      server as never,
      user as never,
      vault as never,
      context
    ),
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
    expect(await s.customerId()).toBe('ct-customer-1')
    const api = await s.api()
    expect((await api.customer.get()).id).toBe('ct-customer-1')
    expect((await api.carts.create({ currency: 'USD' })).customerId).toBe(
      'ct-customer-1'
    )
    await api.carts.query({ where: 'cartState="Active"' })
    expect(server.calls).toEqual(['GET customers/ct-customer-1'])
    expect(server.cartCalls).toEqual([
      'POST carts customerId=ct-customer-1',
      'GET carts where customerId="ct-customer-1" and cartState="Active"',
    ])
    // no me() call: the customer's data never goes through an anonymous token
    expect(meCalls).toEqual([])
    // and the client for non-shopper calls is the project client
    expect(await s.client()).toBe(server)
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
    expect((await api.carts.get('ct-guest-cart-1')).customerId).toBe(
      'ct-customer-1'
    )
    await expect(api.carts.get('ct-guest-cart-other')).rejects.toMatchObject({
      status: 404,
    })
    await expect(
      api.carts.get('ct-cart-of-someone-else')
    ).rejects.toMatchObject({ status: 404 })
    await expect(api.carts.get('ct-missing')).rejects.toMatchObject({
      status: 404,
    })
    expect(server.cartCalls).toEqual(
      expect.arrayContaining([
        'POST carts/ct-guest-cart-1 setCustomerId ct-customer-1',
      ])
    )
    expect(server.cartCalls.filter((c) => c.startsWith('POST carts/'))).toEqual(
      ['POST carts/ct-guest-cart-1 setCustomerId ct-customer-1']
    )
    expect(
      server.carts_.find((c) => c.id === 'ct-guest-cart-other')!.customerId
    ).toBeUndefined()
    expect(
      server.carts_.find((c) => c.id === 'ct-cart-of-someone-else')!.customerId
    ).toBe('ct-customer-99')
    // the only me() calls are the ownership probes of guest carts (anonymous token)
    expect(meCalls).toEqual([
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
    await expect(
      api.carts.update('ct-cart-of-someone-else', 1, [
        { action: 'setCustomerId', customerId: 'ct-customer-1' } as never,
      ])
    ).rejects.toMatchObject({ status: 404 })
    expect(server.cartCalls).toEqual(['GET carts/ct-cart-of-someone-else'])
  })
})

describe('commercetools CustomerScope for a guest', () => {
  it('acts through me() with the anonymous session, never the project API', async () => {
    const { server, meCalls, guestCarts, scope: s } = scope(undefined)
    guestCarts.add('ct-guest-cart-1')
    expect(await s.customerId()).toBeUndefined()
    const api = await s.api()
    expect((await api.carts.get('ct-guest-cart-1')).id).toBe('ct-guest-cart-1')
    await expect(api.carts.get('ct-guest-cart-other')).rejects.toMatchObject({
      status: 404,
    })
    expect(meCalls).toEqual([
      'anon-token GET me/carts/ct-guest-cart-1',
      'anon-token GET me/carts/ct-guest-cart-other',
    ])
    expect(server.calls).toEqual([])
    expect(server.cartCalls).toEqual([])
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
    expect(await s.customerId()).toBe('ct-customer-1')
    const api = await s.api()
    expect((await api.carts.get('ct-customer-cart-1')).id).toBe(
      'ct-customer-cart-1'
    )
    await expect(api.orders.get('ct-order-1')).rejects.toMatchObject({
      status: 404,
    })
    expect(meCalls).toEqual([
      'customer-token GET me/carts/ct-customer-cart-1',
      'customer-token GET me/orders/ct-order-1',
    ])
    expect(server.calls).toEqual([])
    expect(server.cartCalls).toEqual([])
    // non-shopper calls (catalog, shipping methods) use the customer's client too, not the project client
    expect(await s.client()).not.toBe(server)
  })
})

describe('commercetools CustomerScope: taking a guest cart over', () => {
  function withGuest(fail: unknown) {
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
      scope: new CustomerScope(
        server as never,
        user as never,
        vault as never,
        context
      ),
    }
  }

  it('an expired guest token or an outage is passed on, not read as "not this shopper\'s cart" (the cart is not lost)', async () => {
    for (const fail of [
      Object.assign(new Error('expired'), { statusCode: 401 }),
      Object.assign(new Error('down'), { statusCode: 503 }),
    ]) {
      const { server, scope: s } = withGuest(fail)
      await expect((await s.api()).carts.get('ct-guest-cart-9')).rejects.toBe(
        fail
      )
      expect(server.cartCalls.filter((c) => c.startsWith('POST'))).toEqual([])
    }
  })

  it('an ordered cart is never handed to a customer, even when the guest can read it', async () => {
    const { server, guestCarts, scope: s } = scope('ct-customer-1')
    server.carts_.push({ id: 'ct-ordered', version: 3, cartState: 'Ordered' })
    guestCarts.add('ct-ordered')
    await expect((await s.api()).carts.get('ct-ordered')).rejects.toMatchObject(
      {
        status: 404,
      }
    )
    expect(server.cartCalls.filter((c) => c.startsWith('POST'))).toEqual([])
  })
})
