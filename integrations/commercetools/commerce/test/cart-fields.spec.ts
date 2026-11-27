/**
 * The shop's own cart fields on commercetools (`setCartFields`): Custom Fields of the shopper's cart, read back by
 * the shop's cart mapper hook. A cart without a Custom Type gets `shop-cart-fields`; a cart with the project's own
 * type keeps it when the fields are on it, and answers 501 naming the type when they are not. Another customer's
 * cart is 404. Against the in-memory project client (no network).
 */
import { buildPort } from '@core/integration-kit/testing'
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
}
const STORE_KEYS = { 'en-US': 'store-en-US' }

/** A customer's cart as the project API returns it (no lines). */
const ctCart = (id: string, extra: object = {}) => ({
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
  const port = (customerId: string) =>
    buildPort(
      commercetools({
        storeKeys: STORE_KEYS,
        mappers: {
          cart: (raw, mapped) => ({
            ...mapped,
            giftMessage: raw.custom?.fields?.giftMessage as string | undefined,
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
    const cart = await p.setCartFields!('cart-1', {
      giftMessage: 'Happy birthday',
    })
    expect(cart).toMatchObject({ id: 'cart-1', giftMessage: 'Happy birthday' })
    expect(client.carts_[0]!.custom).toEqual({
      type: { typeId: 'type', id: 'type-shop' },
      fields: { giftMessage: 'Happy birthday' },
    })
    const cleared = await p.setCartFields!('cart-1', { giftMessage: null })
    expect(cleared).not.toHaveProperty('giftMessage', 'Happy birthday')
    expect(client.carts_[0]!.custom!.fields).toEqual({})
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
    ).setCartFields!('cart-2', {
      giftMessage: 'Hi',
    })
    expect(cart).toMatchObject({ giftMessage: 'Hi' })
    expect(client.carts_[0]!.custom).toEqual({
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
    await expect(
      p.setCartFields!('cart-3', { giftMessage: 'Hi' })
    ).rejects.toMatchObject({
      status: 501,
      message: expect.stringMatching(/"erp-only" has no field giftMessage/),
    })
    expect(client.carts_[0]!.custom!.fields).toEqual({})
  })

  it('answers 501 naming the type to create when the project has no shop-cart-fields type (not a 400 or 500)', async () => {
    const { client, port } = setup()
    client.types_ = client.types_.filter((t) => t.key !== 'shop-cart-fields')
    client.carts_.push(ctCart('cart-9'))
    const p = await port('cust-1')
    await expect(
      p.setCartFields!('cart-9', { giftMessage: 'Hi' })
    ).rejects.toMatchObject({
      status: 501,
      message: expect.stringMatching(
        /no Custom Type "shop-cart-fields" for carts: create it/
      ),
    })
  })

  it('retries once when the cart changed in between (409)', async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-4'))
    client.conflicts = 1
    const cart = await (
      await port('cust-1')
    ).setCartFields!('cart-4', {
      giftMessage: 'Again',
    })
    expect(cart).toMatchObject({ giftMessage: 'Again' })
    expect(
      client.cartCalls.filter((c) => c === 'POST carts/cart-4 409')
    ).toHaveLength(1)
  })

  it("refuses another customer's cart (404) and writes nothing", async () => {
    const { client, port } = setup()
    client.carts_.push(ctCart('cart-5'))
    await expect(
      (await port('cust-2')).setCartFields!('cart-5', { giftMessage: 'x' })
    ).rejects.toMatchObject({ status: 404 })
    expect(client.carts_[0]!.custom).toBeUndefined()
  })
})
