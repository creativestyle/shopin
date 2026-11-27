/**
 * A guest reads the order it just placed (the order confirmation). The BFF lets a guest ask only for the order its
 * guest-order cookie names; the mock keeps guest orders together, so it must answer that lookup without a customer.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { NotFoundException, UnauthorizedException } from '@nestjs/common'
import account from '../dist/services/account.service.js'
import cart from '../dist/services/cart.service.js'

const { MockOrderService } = account
const { cartStore } = cart

const price = (cents) => ({
  regularPriceInCents: cents,
  currency: 'USD',
  fractionDigits: 2,
})

function guestCart(id) {
  cartStore.set(id, {
    id,
    version: 1,
    lineItems: [],
    subtotal: price(1000),
    grandTotal: price(1000),
    currency: 'USD',
    itemCount: 1,
  })
}

test('a guest reads the order it placed', async () => {
  const orders = new MockOrderService() // no customer context: a guest
  guestCart('mock-cart-guest-read')
  const placed = await orders.createOrder({ cartId: 'mock-cart-guest-read' })
  const read = await orders.getOrder(placed.id)
  assert.equal(read.id, placed.id)
  assert.equal(read.orderNumber, placed.orderNumber)
})

test('a guest asking for an order that does not exist gets not found, not unauthorized', async () => {
  const orders = new MockOrderService()
  await assert.rejects(orders.getOrder('mock-order-missing'), NotFoundException)
})

test('a guest still cannot list orders (the account page needs a customer)', async () => {
  const orders = new MockOrderService()
  await assert.rejects(orders.getOrders(), UnauthorizedException)
})

test("the order keeps the cart's addresses and a guest's e-mail (the confirmation shows them)", async () => {
  const orders = new MockOrderService()
  const address = {
    firstName: 'Ann',
    lastName: 'Tester',
    streetName: 'Main St',
    postalCode: '10115',
    city: 'Berlin',
    country: 'DE',
    email: 'ann@example.com',
  }
  guestCart('mock-cart-guest-addresses')
  cartStore.set('mock-cart-guest-addresses', {
    ...cartStore.get('mock-cart-guest-addresses'),
    billingAddress: address,
    shippingAddress: { ...address, email: undefined },
  })
  const placed = await orders.createOrder({
    cartId: 'mock-cart-guest-addresses',
  })
  const read = await orders.getOrder(placed.id)
  assert.equal(read.email, 'ann@example.com')
  assert.equal(read.billingAddress?.city, 'Berlin')
  assert.equal(read.shippingAddress?.streetName, 'Main St')
})

test('a guest finds the order made from its cart (findOrderByCart); a cart without an order has none', async () => {
  const orders = new MockOrderService()
  guestCart('mock-cart-guest-find')
  assert.equal(await orders.findOrderByCart('mock-cart-guest-find'), undefined)
  const placed = await orders.createOrder({ cartId: 'mock-cart-guest-find' })
  assert.equal(
    (await orders.findOrderByCart('mock-cart-guest-find'))?.id,
    placed.id
  )
  // a customer does not find a guest order by its cart
  const customer = new MockOrderService({
    customerId: async () => 'mock-customer-find',
  })
  assert.equal(
    await customer.findOrderByCart('mock-cart-guest-find'),
    undefined
  )
})
