/**
 * The shop's own cart fields on commercetools (`setCartFields`): Custom Fields of the shopper's cart, read back by
 * the shop's cart mapper hook. A cart without a Custom Type gets `shop-cart-fields`; a cart with the project's own
 * type keeps it when the fields are on it, and answers 501 naming the type when they are not. Another customer's
 * cart is 404. Against the in-memory project client (no network).
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildPort } from '@core/integration-kit/testing'
import shopin from '../dist/shopin.js'
import core from '@integrations/commercetools-core'
import { FakeMeClient, FakeProjectClient } from './fake-client.mjs'

const { commercetools } = shopin
const { COMMERCETOOLS_CLIENT, UserClientService } = core

/** Jest's `toMatchObject` for flat fields: each listed field of `actual` equals the expected one. */
const assertFields = (actual, fields) =>
  assert.deepEqual(
    Object.fromEntries(Object.keys(fields).map((k) => [k, actual?.[k]])),
    fields
  )

const OPTIONS = {
  projectKey: 'proj',
  clientId: 'id',
  clientSecret: 'secret',
  apiUrl: 'https://api.fake.invalid',
  authUrl: 'https://auth.fake.invalid',
}
const STORE_KEYS = { 'en-US': 'store-en-US' }

/** A customer's cart as the project API returns it (no lines). */
const ctCart = (id, extra = {}) => ({
  id,
  version: 1,
  customerId: 'cust-1',
  currency: 'USD',
  lineItems: [],
  totalPrice: { centAmount: 0, currencyCode: 'USD' },
  ...extra,
})

function setup() {
  const client = new FakeProjectClient()
  client.types_.push(
    {
      id: 'type-shop',
      key: 'shop-cart-fields',
      fieldDefinitions: [{ name: 'giftMessage' }],
    },
    {
      id: 'type-project',
      key: 'project-cart',
      fieldDefinitions: [{ name: 'giftMessage' }, { name: 'erpRef' }],
    },
    {
      id: 'type-narrow',
      key: 'erp-only',
      fieldDefinitions: [{ name: 'erpRef' }],
    }
  )
  const port = (customerId) =>
    buildPort(
      commercetools({
        storeKeys: STORE_KEYS,
        mappers: {
          cart: (raw, mapped) => ({
            ...mapped,
            giftMessage: raw.custom?.fields?.giftMessage,
          }),
        },
      }).ports.commerce(),
      {
        customerId,
        storefrontUrl: 'https://shop.test',
        options: OPTIONS,
        providers: [
          { provide: COMMERCETOOLS_CLIENT, useValue: client },
          {
            provide: UserClientService,
            useValue: {
              getClient: async () =>
                new FakeMeClient('anon', { carts: new Set() }, []),
            },
          },
        ],
      }
    )
  return { client, port }
}

describe('commercetools setCartFields', () => {
  it('gives a cart without a Custom Type the shop-cart-fields type; the hook reads the field back; null removes it', async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-1'))
    const p = await port('cust-1')
    const cart = await p.setCartFields('cart-1', {
      giftMessage: 'Happy birthday',
    })
    assertFields(cart, { id: 'cart-1', giftMessage: 'Happy birthday' })
    assert.deepEqual(client.carts_[0].custom, {
      type: { typeId: 'type', id: 'type-shop' },
      fields: { giftMessage: 'Happy birthday' },
    })
    const cleared = await p.setCartFields('cart-1', { giftMessage: null })
    assert.notEqual(cleared.giftMessage, 'Happy birthday')
    assert.deepEqual(client.carts_[0].custom.fields, {})
  })

  it("keeps the project's own Custom Type when it has the field", async () => {
    const { client, port } = setup()
    client.carts_.push(
      ctCart('cart-2', {
        custom: {
          type: { typeId: 'type', id: 'type-project' },
          fields: { erpRef: 'E-1' },
        },
      })
    )
    const cart = await (
      await port('cust-1')
    ).setCartFields('cart-2', {
      giftMessage: 'Hi',
    })
    assertFields(cart, { giftMessage: 'Hi' })
    assert.deepEqual(client.carts_[0].custom, {
      type: { typeId: 'type', id: 'type-project' },
      fields: { erpRef: 'E-1', giftMessage: 'Hi' },
    })
  })

  it('answers 501 naming the type and the field when the cart’s own type lacks the field', async () => {
    const { client, port } = setup()
    client.carts_.push(
      ctCart('cart-3', {
        custom: { type: { typeId: 'type', id: 'type-narrow' }, fields: {} },
      })
    )
    const p = await port('cust-1')
    await assert.rejects(p.setCartFields('cart-3', { giftMessage: 'Hi' }), {
      status: 501,
      message: /"erp-only" has no field giftMessage/,
    })
    assert.deepEqual(client.carts_[0].custom.fields, {})
  })

  it('answers 501 naming the type to create when the project has no shop-cart-fields type (not a 400 or 500)', async () => {
    const { client, port } = setup()
    client.types_ = client.types_.filter((t) => t.key !== 'shop-cart-fields')
    client.carts_.push(ctCart('cart-9'))
    const p = await port('cust-1')
    await assert.rejects(p.setCartFields('cart-9', { giftMessage: 'Hi' }), {
      status: 501,
      message: /no Custom Type "shop-cart-fields" for carts: create it/,
    })
  })

  it('retries once when the cart changed in between (409)', async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-4'))
    client.conflicts = 1
    const cart = await (
      await port('cust-1')
    ).setCartFields('cart-4', {
      giftMessage: 'Again',
    })
    assertFields(cart, { giftMessage: 'Again' })
    assert.equal(
      client.cartCalls.filter((c) => c === 'POST carts/cart-4 409').length,
      1
    )
  })

  it('answers 409 (not 502) when the cart changed again on the retry', async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-6'))
    client.conflicts = 2
    const p = await port('cust-1')
    await assert.rejects(p.setCartFields('cart-6', { giftMessage: 'x' }), {
      status: 409,
    })
    assert.equal(
      client.cartCalls.filter((c) => c === 'POST carts/cart-6 409').length,
      2
    )
  })

  it('does not retry a 409 that is not a version conflict', async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-7'))
    client.conflicts = 1
    client.conflictCode = 'DuplicateField'
    const p = await port('cust-1')
    await assert.rejects(p.setCartFields('cart-7', { giftMessage: 'x' }), {
      statusCode: 409,
      body: { errors: [{ code: 'DuplicateField' }] },
    })
    assert.equal(
      client.cartCalls.filter((c) => c === 'POST carts/cart-7 409').length,
      1
    )
    assert.equal(client.carts_[0].custom, undefined)
  })

  it("refuses another customer's cart (404) and writes nothing", async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-5'))
    await assert.rejects(
      (await port('cust-2')).setCartFields('cart-5', { giftMessage: 'x' }),
      { status: 404 }
    )
    assert.equal(client.carts_[0].custom, undefined)
  })
})
