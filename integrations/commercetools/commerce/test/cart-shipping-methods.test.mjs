import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import cartService from '../dist/services/cart.service.js'
import customerScope from '../dist/shared/customer-scope.service.js'

const { CartService } = cartService
const { CustomerScope } = customerScope

/** Jest's `toMatchObject` for flat fields: each listed field of `actual` equals the expected one. */
const assertFields = (actual, fields) =>
  assert.deepEqual(
    Object.fromEntries(Object.keys(fields).map((k) => [k, actual?.[k]])),
    fields
  )

function rate(centAmount, currencyCode, isMatching) {
  return {
    price: { centAmount, currencyCode },
    ...(isMatching !== undefined && { isMatching }),
  }
}

function shippingMethod(id, rates, extra = {}) {
  return {
    id,
    name: `method-${id}`,
    zoneRates: rates.map((shippingRates) => ({ shippingRates })),
    ...extra,
  }
}

function createService(language, results) {
  const client = {
    // the shopper's own cart is read first (any other id answers 404)
    me: () => ({
      carts: () => ({
        withId: () => ({
          get: () => ({
            execute: mock.fn(async () => ({ body: { id: 'cart-1' } })),
          }),
        }),
      }),
    }),
    shippingMethods: () => ({
      matchingCart: () => ({
        get: () => ({
          execute: mock.fn(async () => ({ body: { results } })),
        }),
      }),
    }),
  }
  const userClientService = { getClient: async () => client }
  const languageProvider = { getCurrentLanguage: () => language }
  return new CartService(
    new CustomerScope({}, userClientService, { get: async () => undefined }),
    {},
    languageProvider
  )
}

describe('CommercetoolsCartService shipping methods', () => {
  it('uses the rate commercetools matched to the cart in a multi-currency zone', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [
        [rate(900, 'USD', false), rate(500, 'EUR', true), rate(700, 'EUR')],
      ]),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    assert.deepEqual(shippingMethods[0]?.price, {
      regularPriceInCents: 500,
      currency: 'EUR',
      fractionDigits: 2,
    })
  })

  it('falls back to the rate in the cart currency when none is marked matching', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(900, 'USD')], [rate(700, 'EUR')]]),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    assert.deepEqual(shippingMethods[0]?.price, {
      regularPriceInCents: 700,
      currency: 'EUR',
      fractionDigits: 2,
    })
  })

  it('omits a method with no usable rate instead of showing it as free', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(900, 'USD')]]),
      shippingMethod('b', [[rate(500, 'EUR')]]),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    assert.deepEqual(
      shippingMethods.map((method) => method.id),
      ['b']
    )
  })

  it('falls back to the default locale for name, description and delivery time', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(500, 'EUR')]], {
        localizedName: { 'en-US': 'Standard' },
        localizedDescription: { 'en-US': 'Standard delivery' },
        custom: { fields: { deliveryTime: { 'en-US': '2-3 business days' } } },
      }),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    assertFields(shippingMethods[0], {
      name: 'Standard',
      description: 'Standard delivery',
      deliveryTime: '2-3 business days',
    })
  })

  it('resolves name, description and delivery time to the request language', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(500, 'EUR')]], {
        localizedName: { 'en-US': 'Standard', 'de-DE': 'Standardversand' },
        custom: {
          fields: {
            deliveryTime: { 'en-US': '1 business day', 'de-DE': '1 Werktag' },
          },
        },
      }),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    assertFields(shippingMethods[0], {
      name: 'Standardversand',
      deliveryTime: '1 Werktag',
    })
  })

  it('keeps the method when the deliveryTime field has another type', async () => {
    const service = createService('de-DE', [
      shippingMethod('a', [[rate(500, 'EUR')]], {
        custom: { fields: { deliveryTime: '2-3 days' } },
      }),
    ])

    const { shippingMethods } = await service.getShippingMethods('cart-1')

    assert.equal(shippingMethods.length, 1)
    assert.equal(shippingMethods[0]?.deliveryTime, undefined)
  })
})
