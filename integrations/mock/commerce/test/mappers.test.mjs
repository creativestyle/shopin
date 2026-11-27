/**
 * The shop's mapper hooks (`mock({ mappers })`, docs/extending.md): each runs after the built-in mapping, gets
 * the mock platform's record (cart custom fields, catalog attributes) and the mapped contract. Without a hook
 * the services are passed through untouched.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import descriptor from '../dist/shopin.js'
import { cartFields } from '../dist/services/cart.service.js'

const cart = (id) => ({ id, version: 1, lineItems: [], itemCount: 0 })
const card = (id) => ({
  id,
  slug: id,
  name: id,
  attributes: { color: 'blue', size: 'M', material: 'wool', brand: 'B' },
})
const facade = () => ({
  cartService: {
    getCart: async (id) => cart(id),
    getShippingMethods: async () => ({ shippingMethods: [] }),
  },
  cartPaymentService: { setPaymentMethod: async (id) => cart(id) },
  productCollectionService: {
    getProductCollection: async () => ({
      productList: [card('p1')],
      total: 1,
    }),
  },
  productService: {
    getProduct: async (slug) => ({
      product: { ...card(slug), description: '' },
      breadcrumb: [],
    }),
  },
  wishlistService: {
    getWishlist: async () => ({
      id: 'w1',
      version: 1,
      items: [{ id: 'l1', product: card('p3') }],
      itemCount: 1,
    }),
  },
  productSearchService: {
    searchProducts: async () => ({ products: [card('p2')], total: 1 }),
  },
  customers: { marker: true },
})
const shop = descriptor.mock({
  mappers: {
    cart: (raw, mapped) => ({
      ...mapped,
      giftMessage: raw.custom.fields.giftMessage,
    }),
    productCard: (raw, mapped) => ({
      ...mapped,
      material: raw.attributes.material,
    }),
    product: (raw, mapped) => ({
      ...mapped,
      brand: raw.attributes.brand,
    }),
  },
})

test('the cart hook adds the shop field from the cart custom fields, on every service that returns a cart', async () => {
  cartFields.set('c1', { giftMessage: 'Happy birthday' })
  const commerce = shop.ports.commerce().useFactory(facade())
  assert.equal(
    (await commerce.cartService.getCart('c1')).giftMessage,
    'Happy birthday'
  )
  assert.equal(
    (await commerce.cartPaymentService.setPaymentMethod('c1')).giftMessage,
    'Happy birthday'
  )
  // a result that is no cart passes through
  assert.deepEqual(await commerce.cartService.getShippingMethods(), {
    shippingMethods: [],
  })
  // the other members are kept (the BFF copies the port's own keys)
  assert.deepEqual(commerce.customers, { marker: true })
})

test('the card hook gets the catalog record and the mapped card without the attributes', async () => {
  const commerce = shop.ports.commerce().useFactory(facade())
  const [mapped] = (
    await commerce.productCollectionService.getProductCollection('c')
  ).productList
  assert.equal(mapped.material, 'wool')
  assert.equal(mapped.attributes, undefined)
})

test('the card hook maps the product cards of a wishlist', async () => {
  const commerce = shop.ports.commerce().useFactory(facade())
  const [item] = (await commerce.wishlistService.getWishlist('w1')).items
  assert.equal(item.id, 'l1')
  assert.equal(item.product.material, 'wool')
  assert.equal(item.product.attributes, undefined)
})

test('the product hook gets the catalog record of the product page and the mapped product', async () => {
  const commerce = shop.ports.commerce().useFactory(facade())
  const page = await commerce.productService.getProduct('p4')
  assert.equal(page.product.brand, 'B')
  assert.equal(page.product.attributes, undefined)
  assert.deepEqual(page.breadcrumb, [])
})

test('the card hook maps the product search results (search served by commerce)', async () => {
  const commerce = shop.ports.commerce().useFactory(facade())
  const [hit] = (
    await commerce.productSearchService.searchProducts({ query: 'x' })
  ).products
  assert.equal(hit.material, 'wool')
  assert.equal(hit.attributes, undefined)
})

test('without hooks the services are the originals and carry no shop field', async () => {
  cartFields.set('c2', { giftMessage: 'not mapped' })
  const services = facade()
  const commerce = descriptor.mock().ports.commerce().useFactory(services)
  assert.equal(commerce.cartService, services.cartService)
  assert.equal(commerce.productService, services.productService)
  assert.equal(commerce.wishlistService, services.wishlistService)
  assert.equal(
    (await commerce.cartService.getCart('c2')).giftMessage,
    undefined
  )
})

test('the card hook reads the attributes of real search results (not only of a fake)', async () => {
  const { MockApi } = await import('../dist/client/client.module.js')
  const { ProductSearchService } =
    await import('../dist/services/product-search.service.js')
  const { faker, fakerDE } = await import('@faker-js/faker')
  const language = { getCurrentLanguage: () => 'en-US' }
  const search = new ProductSearchService(
    new MockApi(language, { faker, fakerDE }),
    language
  )
  const real = shop.ports
    .commerce()
    .useFactory({ ...facade(), productSearchService: search })
  const { products } = await real.productSearchService.searchProducts({
    query: 'a',
  })
  assert.ok(products.length > 0, 'the query finds products')
  for (const hit of products) {
    assert.ok('material' in hit, 'the hook ran on every card without throwing')
  }
})
