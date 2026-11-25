/**
 * The commerce contract suite itself: the shape case names a missing service or method, a 501 stub fails its case,
 * an upstream failure must reach the BFF as 502/503/504, and `recordedFetch` answers only what was recorded.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import kit from '../dist/index.js'
import testing from '../dist/testing.js'

const { commerceContract, recordedFetch } = testing

const METHODS = {
  productService: ['getProduct'],
  productCollectionService: ['getProductCollection'],
  productSearchService: ['searchProducts'],
  navigationService: ['getNavigation'],
  cartService: [
    'getCart',
    'createCart',
    'addToCart',
    'updateCartItem',
    'removeCartItem',
    'setBillingAddress',
    'setShippingAddress',
    'getShippingMethods',
    'setShippingMethod',
    'getActiveCart',
  ],
  cartPaymentService: ['setPaymentMethod', 'verifyAndUpdatePaymentAmounts'],
  storeConfigService: ['getStoreConfig'],
  wishlistService: [
    'getWishlist',
    'getOrCreateWishlist',
    'addToWishlist',
    'removeFromWishlist',
  ],
  customerService: [
    'getCurrentCustomer',
    'updateCustomer',
    'changeCustomerPassword',
    'changeCustomerEmail',
  ],
  customerAddressService: [
    'getAddresses',
    'addAddress',
    'updateAddress',
    'deleteAddress',
    'setDefaultShippingAddress',
    'setDefaultBillingAddress',
  ],
  orderService: ['createOrder', 'getOrder', 'getOrders'],
}
const stub = () =>
  Object.fromEntries(
    Object.entries(METHODS).map(([s, ms]) => [
      s,
      Object.fromEntries(ms.map((m) => [m, async () => {}])),
    ])
  )
const shapeCase = (port) =>
  commerceContract(async () => port, {}).find((c) =>
    c.name.includes('every service')
  )

test('without data, only the shape case and the stub case of each method run', () => {
  const names = commerceContract(async () => stub(), {}).map((c) => c.name)
  assert.equal(
    names[0],
    'commerce: every service and method the BFF calls is there'
  )
  assert.deepEqual(
    names.slice(1),
    Object.entries(METHODS).flatMap(([s, ms]) =>
      ms.map((m) => `commerce: ${s}.${m} is written (a stub answers 501)`)
    )
  )
})

test('a method that answers 501 (a todo stub) fails its case, named by service.method', async () => {
  const port = stub()
  port.customerAddressService.addAddress = async () => {
    throw Object.assign(new Error('todo'), { status: 501 })
  }
  const cases = commerceContract(async () => port, {})
  const stubCase = cases.find((c) => c.name.includes('addAddress'))
  assert.deepEqual(stubCase.services, ['customerAddressService.addAddress'])
  await assert.rejects(
    stubCase.run(),
    /customerAddressService\.addAddress answers 501/
  )
  // a method that fails for another reason (no arguments given) is written
  port.customerAddressService.addAddress = async () => {
    throw Object.assign(new Error('bad request'), { status: 400 })
  }
  await stubCase.run()
  // a left-out optional service's stub cases are skipped
  const noWishlist = stub()
  delete noWishlist.wishlistService
  for (const c of commerceContract(async () => noWishlist, {}).filter((c) =>
    c.name.includes('wishlistService.')
  )) {
    await c.run()
  }
})

test('the checkout, customer, address and order-list cases run with data', () => {
  const names = commerceContract(async () => stub(), {
    product: { slug: 'p' },
    cart: true,
    orders: { customers: ['a', 'b'] },
  }).map((c) => c.name)
  for (const part of [
    'checkout:',
    'the signed-in customer reads and updates',
    "a customer's addresses",
    'the order list holds',
    'is 502, 503 or 504',
  ]) {
    assert.ok(
      names.some((n) => n.includes(part)),
      part
    )
  }
})

test('a platform that fails reaches the BFF as 502/503/504: a port that turns it into another error fails', async () => {
  const errorCase = (getProduct) =>
    commerceContract(
      async () => ({ ...stub(), productService: { getProduct } }),
      {
        product: { slug: 'p' },
      }
    ).find((c) => c.name.includes('is 502, 503 or 504'))
  // maps the failure: a network error or a 5xx answer of the platform is "Bad gateway"
  await errorCase(async () => {
    let res
    try {
      res = await fetch('https://platform.invalid/products/p')
    } catch {
      throw Object.assign(new Error('platform unreachable'), { status: 502 })
    }
    if (res.status >= 500) {
      throw Object.assign(new Error('platform failed'), { status: 503 })
    }
    return res.json()
  }).run()
  // passes the raw error on (the BFF would answer 500)
  await assert.rejects(
    errorCase(async () =>
      (await fetch('https://platform.invalid/products/p')).json()
    ).run(),
    /expected 502, 503 or 504/
  )
  // a port that never calls fetch (an SDK client, in memory): not tested, reported as skipped, never a pass
  const skips = []
  await errorCase(async () => ({ product: {} })).run({
    skip: (why) => skips.push(why),
  })
  assert.match(
    skips[0] ?? '',
    /not tested: the port does not call the global fetch/
  )
  assert.equal(typeof globalThis.fetch, 'function')
})

test("a case of a member the port leaves out is reported as skipped (node:test's t.skip), not passed", async () => {
  const noWishlist = stub()
  delete noWishlist.wishlistService
  const c = commerceContract(async () => noWishlist, {}).find((c) =>
    c.name.includes('wishlistService.getWishlist')
  )
  const skips = []
  await c.run({ skip: (why) => skips.push(why) })
  assert.deepEqual(skips, ['skipped: the port has no wishlistService'])
})

/** A port whose carts belong to the customer that created them (`owned`: false lets anyone read any cart). */
function cartPort(owned, customerId, carts, withFields) {
  const cartOf = (id) => {
    const c = carts.get(id)
    if (!c || (owned && c.owner !== customerId)) {
      throw Object.assign(new Error('no cart'), { status: 404 })
    }
    return c
  }
  const view = (c) => ({
    id: c.id,
    version: 1,
    lineItems: c.lines,
    subtotal: { regularPriceInCents: 0, currency: 'USD', fractionDigits: 2 },
    grandTotal: { regularPriceInCents: 0, currency: 'USD', fractionDigits: 2 },
    currency: 'USD',
    itemCount: c.lines.length,
  })
  const port = stub()
  port.productService.getProduct = async () => ({ product: { id: 'p1' } })
  port.cartService.createCart = async () => {
    const c = { id: `c${carts.size + 1}`, owner: customerId, lines: [] }
    carts.set(c.id, c)
    return view(c)
  }
  port.cartService.getCart = async (id) => view(cartOf(id))
  port.cartService.addToCart = async (id) => {
    const c = cartOf(id)
    c.lines.push({ id: `l${c.lines.length}` })
    return view(c)
  }
  if (withFields) {
    port.setCartFields = async (id, fields) => {
      const c = cartOf(id)
      c.fields = { ...c.fields, ...fields }
      return view(c)
    }
  }
  return port
}

const cartCase = (owned, part, cart = true, withFields = true) => {
  const carts = new Map()
  return commerceContract(
    async (as = {}) => cartPort(owned, as.customerId, carts, withFields),
    { product: { slug: 'p' }, cart, orders: { customers: ['a', 'b'] } }
  ).find((c) => c.name.includes(part))
}

test("a customer's cart is refused to another customer and to a guest (its own case, without attachGuestCart)", async () => {
  await cartCase(true, "a customer's cart is that customer's").run()
  await assert.rejects(
    cartCase(false, "a customer's cart is that customer's").run(),
    /another customer reads it/
  )
})

test('setCartFields: written to the own cart, refused for others; not tested without fields, skipped without the member', async () => {
  const fields = { cart: { fields: { giftMessage: 'Hi' } } }
  await cartCase(true, 'setCartFields', fields.cart).run()
  await assert.rejects(
    cartCase(false, 'setCartFields', fields.cart).run(),
    /Missing expected rejection/
  )
  const skips = []
  await cartCase(true, 'setCartFields').run({ skip: (w) => skips.push(w) })
  await cartCase(true, 'setCartFields', fields.cart, false).run({
    skip: (w) => skips.push(w),
  })
  assert.match(skips[0], /not tested: name fields/)
  assert.equal(skips[1], 'skipped: the port has no setCartFields')
})

test('the shape case passes a complete port and names a missing service or method', async () => {
  await shapeCase(stub()).run()
  const noCustomerService = stub()
  delete noCustomerService.customerService
  await assert.rejects(
    shapeCase(noCustomerService).run(),
    /customerService is missing/
  )
  const noGetOrder = stub()
  delete noGetOrder.orderService.getOrder
  await assert.rejects(
    shapeCase(noGetOrder).run(),
    /orderService.getOrder is missing/
  )
})

test('optional members: a port may leave out the wishlist; attachGuestCart is only an optional method (no list names it)', async () => {
  const noWishlist = stub()
  delete noWishlist.wishlistService
  await shapeCase(noWishlist).run()
  // a wishlist that is there must be complete
  const halfWishlist = stub()
  delete halfWishlist.wishlistService.addToWishlist
  await assert.rejects(
    shapeCase(halfWishlist).run(),
    /wishlistService.addToWishlist is missing/
  )
  await shapeCase({ ...stub(), attachGuestCart: async () => ({}) }).run()
})

test('the attach case is skipped for a port without attachGuestCart', async () => {
  const attach = commerceContract(async () => stub(), {
    product: { slug: 'p' },
    cart: true,
    orders: { customers: ['a', 'b'] },
  }).find((c) => c.name.includes('attachGuestCart'))
  assert.deepEqual(attach.services, [
    'attachGuestCart',
    'cartService',
    'productService',
  ])
  // stub() has no attachGuestCart: the case passes without calling the port's cart service
  await attach.run()
})

test('the order case needs cart data', () => {
  assert.throws(
    () => commerceContract(async () => stub(), { orders: true }),
    /need `cart` and `product`/
  )
})

test('recordedFetch answers recorded requests (a list in order) and refuses any other', async () => {
  const fetch = recordedFetch({
    'GET https://api.example.test/products/1': { body: { id: '1' } },
    'POST https://api.example.test/carts': [
      { status: 201, body: { id: 'c1' } },
      { status: 201, body: { id: 'c2' } },
    ],
  })
  assert.deepEqual(
    await (await fetch('https://api.example.test/products/1')).json(),
    { id: '1' }
  )
  const first = await fetch('https://api.example.test/carts', {
    method: 'POST',
  })
  assert.equal(first.status, 201)
  assert.deepEqual(await first.json(), { id: 'c1' })
  assert.deepEqual(
    await (
      await fetch('https://api.example.test/carts', { method: 'POST' })
    ).json(),
    { id: 'c2' }
  )
  await assert.rejects(
    fetch('https://api.example.test/products/2'),
    /no recording for GET https:\/\/api.example.test\/products\/2/
  )
  assert.deepEqual(fetch.calls, [
    'GET https://api.example.test/products/1',
    'POST https://api.example.test/carts',
    'POST https://api.example.test/carts',
    'GET https://api.example.test/products/2',
  ])
})

test('buildPort: the port gets its options, the guest or signed-in customer, the request context and its own vault', async () => {
  await import('reflect-metadata')
  const { buildPort } = testing
  const { port, PortOptions, CustomerContext, RequestContext, TokenVault } = kit
  const definition = port('cms', {
    inject: [PortOptions, CustomerContext, RequestContext, TokenVault],
    useFactory: (options, customer, context, vault) => ({
      options,
      customer,
      context,
      vault,
    }),
  })
  const storefrontUrl = 'https://shop.test'
  const guest = await buildPort(definition, {
    storefrontUrl,
    options: { KEY: 'k' },
  })
  assert.deepEqual({ ...guest.options }, { KEY: 'k' })
  assert.ok(Object.isFrozen(guest.options))
  assert.equal(await guest.customer.customerId(), undefined)
  assert.equal(guest.context.storefrontUrl, storefrontUrl)
  assert.equal(guest.context.language, 'en-US')
  assert.equal(guest.context.currency, 'USD')
  assert.deepEqual(guest.context.locales, ['en-US'])

  assert.equal(await guest.vault.get(), undefined)
  const tokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 60 }
  await guest.vault.set(tokens, true)
  assert.deepEqual(await guest.vault.get(), { ...tokens, customer: true })
  guest.vault.clear()
  assert.equal(await guest.vault.get(), undefined)

  const signedIn = await buildPort(definition, {
    storefrontUrl,
    customerId: 'c-1',
    locales: ['de-DE', 'en-US'],
  })
  assert.equal(await signedIn.customer.customerId(), 'c-1')
  assert.deepEqual(signedIn.context.locales, ['de-DE', 'en-US'])
  // each port gets its own vault: nothing from the first one leaks in
  assert.equal(await signedIn.vault.get(), undefined)
})
