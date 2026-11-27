import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import cartService from '../dist/services/cart.service.js'
import customerScope from '../dist/shared/customer-scope.service.js'

const { CartService } = cartService
const { CustomerScope } = customerScope

const colorDef = {
  name: 'color',
  label: { 'en-US': 'Color', 'de-DE': 'Farbe' },
  type: { name: 'lenum' },
  level: 'Variant',
}
const sizeDef = {
  name: 'size',
  label: { 'en-US': 'Size', 'de-DE': 'Größe' },
  type: { name: 'enum' },
  level: 'Variant',
}

function variant(id, color, size) {
  return {
    id,
    sku: `sku-${id}`,
    attributes: [
      {
        name: 'color',
        value: { key: color, label: { 'en-US': color, 'de-DE': color } },
      },
      { name: 'size', value: { key: size, label: size } },
    ],
  }
}

function lineItem(lineVariant, product) {
  return {
    id: 'line-1',
    productId: 'product-1',
    name: { 'en-US': 'Shirt', 'de-DE': 'Hemd' },
    quantity: 1,
    variant: lineVariant,
    ...(product !== undefined && { product }),
    price: { value: { centAmount: 1000, currencyCode: 'EUR' } },
  }
}

// The line item product as `lineItems[*].product(.productType)` expands it
function expandedProduct(variants) {
  const [masterVariant, ...rest] = variants
  return {
    id: 'product-1',
    masterData: {
      current: {
        slug: { 'en-US': 'shirt', 'de-DE': 'hemd' },
        masterVariant,
        variants: rest,
      },
    },
    productType: {
      typeId: 'product-type',
      id: 'type-1',
      obj: { attributes: [colorDef, sizeDef] },
    },
  }
}

function createService(language, lineItems) {
  const cart = {
    id: 'cart-1',
    version: 1,
    lineItems,
    totalPrice: { centAmount: 1000, currencyCode: 'EUR' },
  }
  const client = {
    me: () => ({
      carts: () => ({
        withId: () => ({
          get: () => ({
            execute: mock.fn(async () => ({ body: cart })),
          }),
        }),
      }),
    }),
  }
  // the project client (server) must not be touched: any property read is recorded
  const serverGetClient = mock.fn()
  const server = new Proxy({}, { get: (_t, key) => serverGetClient(key) })
  const user = { getClient: async () => client }
  const service = new CartService(
    new CustomerScope(server, user, { get: async () => undefined }),
    server,
    { getCurrentLanguage: () => language }
  )
  return { service, serverGetClient }
}

describe('CommercetoolsCartService line item variant attributes', () => {
  it('lists only the attributes that differ across variants, without a product query', async () => {
    const red = variant(1, 'Red', 'M')
    const blue = variant(2, 'Blue', 'M')
    const { service, serverGetClient } = createService('en-US', [
      lineItem(blue, expandedProduct([red, blue])),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    assert.deepEqual(cart.lineItems[0]?.variantAttributes, [
      { name: 'color', label: 'Color', value: 'Blue' },
    ])
    assert.equal(serverGetClient.mock.callCount(), 0)
  })

  it('localizes labels from the product type', async () => {
    const red = variant(1, 'Rot', 'M')
    const blueLarge = variant(2, 'Blau', 'L')
    const { service } = createService('de-DE', [
      lineItem(blueLarge, expandedProduct([red, blueLarge])),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    assert.deepEqual(cart.lineItems[0]?.variantAttributes, [
      { name: 'color', label: 'Farbe', value: 'Blau' },
      { name: 'size', label: 'Größe', value: 'L' },
    ])
  })

  it('lists nothing for a single-variant product', async () => {
    const only = variant(1, 'Red', 'M')
    const { service } = createService('en-US', [
      lineItem(only, expandedProduct([only])),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    assert.equal(cart.lineItems[0]?.variantAttributes, undefined)
  })

  it('keeps color/size keyed by name, and no variant attributes, without the expanded product', async () => {
    const { service } = createService('en-US', [
      lineItem(variant(1, 'Red', 'M')),
    ])

    const cart = await service.getCart('cart-1', { withInventory: false })

    assert.deepEqual(cart.lineItems[0]?.attributes, {
      color: 'Red',
      size: 'M',
    })
    assert.equal(cart.lineItems[0]?.variantAttributes, undefined)
  })
})
