/**
 * Mock commerce's descriptor and port: the port loads lazily and declares its category (the BFF refuses a
 * mismatch), its factory returns the commerce services, and every constructor dependency of the commerce facade
 * is provided (else Nest fails at boot). Search on mock data is the BFF's commerce search (its own test).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import descriptor from '../dist/shopin.js'
import commerce from '../dist/parts/commerce.js'

const COMMERCE_SERVICES = [
  'productService',
  'productCollectionService',
  'productSearchService',
  'navigationService',
  'cartService',
  'cartPaymentService',
  'storeConfigService',
  'wishlistService',
  'customerService',
  'customerAddressService',
  'orderService',
]

test('the descriptor serves commerce only, and its port declares that category', () => {
  const mock = descriptor.mock()
  assert.equal(mock.id, 'mock')
  assert.deepEqual(Object.keys(mock.ports), ['commerce'])
  assert.equal(mock.ports.commerce().category, 'commerce')
  assert.equal(mock.requires, undefined)
})

test('the commerce facade gets every constructor dependency from the port providers', () => {
  const port = commerce.default
  const { MockCommerce } = commerce
  const params = Reflect.getMetadata('design:paramtypes', MockCommerce)
  assert.equal(params.length, COMMERCE_SERVICES.length + 1)
  for (const dependency of params) {
    assert.ok(
      port.providers.includes(dependency),
      `${dependency.name} is not provided`
    )
  }
  assert.deepEqual(port.inject, [MockCommerce])
})

test('the commerce factory returns the facade with every commerce service and the customer store', () => {
  const services = Object.fromEntries(
    [...COMMERCE_SERVICES, 'customers'].map((key) => [key, { key }])
  )
  const facade = new commerce.MockCommerce(
    ...COMMERCE_SERVICES.map((key) => services[key]),
    services.customers
  )
  const result = commerce.default.useFactory(facade)
  for (const key of [...COMMERCE_SERVICES, 'customers']) {
    assert.equal(result[key], services[key], key)
  }
})
