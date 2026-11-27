/**
 * The shop's mapper hooks (`commercetools({ mappers })`, docs/extending.md): each runs after the built-in
 * mapper and gets the commercetools resource, so a custom field or an attribute reaches the contract.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import cartService from '../dist/services/cart.service.js'
import productService from '../dist/services/product.service.js'
import wishlistMapper from '../dist/mappers/wishlist.js'
import searchResults from '../dist/mappers/search-results.js'
import commercePart from '../dist/parts/commerce.js'
import shopin from '../dist/shopin.js'
import mapperHooks from '../dist/mapper-hooks.js'

const { CartService } = cartService
const { ProductService } = productService
const { mapShoppingListToWishlist } = wishlistMapper
const { mapProjectionsToCards } = searchResults
const commerce = commercePart.default
const { commercetools } = shopin
const { MapperHooks: MapperHooksToken } = mapperHooks

const cartBody = {
  id: 'cart-1',
  version: 1,
  lineItems: [],
  totalPrice: { centAmount: 0, currencyCode: 'EUR' },
  custom: {
    type: { typeId: 'type', id: 't1' },
    fields: { giftMessage: 'Happy birthday' },
  },
}

const processCart = (hooks) => {
  const service = new CartService(
    {},
    {},
    { getCurrentLanguage: () => 'en-US' },
    hooks
  )
  return service.processCartResponse(cartBody, 'en-US')
}

const projection = {
  id: 'p1',
  createdAt: '2026-01-01T00:00:00.000Z',
  name: { 'en-US': 'Pool' },
  slug: { 'en-US': 'pool' },
  masterVariant: {
    id: 1,
    attributes: [{ name: 'poolType', value: 'above-ground' }],
  },
}

/** A client whose product projection query answers `results`. */
const projectionsClient = (results) => ({
  productProjections: () => ({
    get: () => ({ execute: async () => ({ body: { results } }) }),
  }),
})
const english = { getCurrentLanguage: () => 'en-US' }
const poolType = (raw, mapped) => ({
  ...mapped,
  poolType: raw.masterVariant.attributes?.find((a) => a.name === 'poolType')
    ?.value,
})

describe('commercetools mapper hooks', () => {
  it('the cart hook reads the cart custom field after the built-in mapper', async () => {
    const cart = await processCart({
      cart: (raw, mapped) => ({
        ...mapped,
        giftMessage: raw.custom?.fields?.giftMessage,
      }),
    })
    assert.equal(cart.id, 'cart-1')
    assert.equal(cart.giftMessage, 'Happy birthday')
  })

  it('without a hook the cart has no shop field', async () => {
    const cart = await processCart()
    assert.equal('giftMessage' in cart, false)
  })

  it('the card hook reads a product attribute for search results and category pages', () => {
    const [card] = mapProjectionsToCards(
      ['p1'],
      [projection],
      'en-US',
      (raw, mapped) => ({
        ...mapped,
        poolType: raw.masterVariant.attributes?.find(
          (a) => a.name === 'poolType'
        )?.value,
      })
    )
    assert.equal(card.id, 'p1')
    assert.equal(card.poolType, 'above-ground')
    const [plain] = mapProjectionsToCards(['p1'], [projection], 'en-US')
    assert.equal('poolType' in plain, false)
  })

  it('the product hook reads a product attribute for the product page', async () => {
    const hooked = new ProductService(
      projectionsClient([projection]),
      english,
      {
        product: poolType,
      }
    )
    const { product } = await hooked.getProduct('pool')
    assert.equal(product.id, 'p1')
    assert.equal(product.name, 'Pool')
    assert.equal(product.poolType, 'above-ground')
    const plain = new ProductService(projectionsClient([projection]), english)
    assert.equal('poolType' in (await plain.getProduct('pool')).product, false)
  })

  it('the card hook reads a product attribute for the cards of a wishlist', async () => {
    const list = {
      id: 'w1',
      version: 1,
      lineItems: [
        {
          id: 'l1',
          productId: 'p1',
          name: { 'en-US': 'Pool' },
          variant: {
            id: 1,
            prices: [
              {
                value: {
                  centAmount: 100,
                  currencyCode: 'EUR',
                  fractionDigits: 2,
                },
              },
            ],
          },
        },
      ],
    }
    const wishlist = await mapShoppingListToWishlist(
      list,
      'en-US',
      projectionsClient([projection]),
      poolType
    )
    const item = wishlist.items[0]
    assert.equal(item.id, 'l1')
    assert.equal(item.product.id, 'p1')
    assert.equal(item.product.slug, 'pool')
    assert.equal(item.product.poolType, 'above-ground')
    const plain = await mapShoppingListToWishlist(
      list,
      'en-US',
      projectionsClient([projection])
    )
    assert.equal('poolType' in plain.items[0].product, false)
  })

  it('the descriptor hands the hooks to the commerce port', () => {
    const cart = (_, mapped) => mapped
    const integration = commercetools({ mappers: { cart } })
    for (const load of [integration.ports.commerce]) {
      const hooks = load().providers.find((p) => p.provide === MapperHooksToken)
      assert.deepEqual(hooks?.useValue, { cart })
    }
    assert.equal(commerce.category, 'commerce')
  })
})
