/**
 * Mock payment provider: its descriptor serves psp only (a part of mock data, id `mock`) and names its own page for
 * the PaymentStep slot; its service offers valid payment methods and links to the storefront's payment step.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PaymentMethodsResponseSchema } from '@core/contracts/cart/payment-method'
import { PAYMENT_STEP_PATH } from '@core/contracts/core/data-source-interfaces'
import descriptor from '../dist/shopin.js'
import payment from '../dist/server/parts/payment.js'
import { PaymentService } from '../dist/server/index.js'

const context = (storefrontUrl = 'https://shop.example') => ({
  getCurrentLanguage: () => 'en-US',
  storefrontUrl,
})

test('the descriptor serves psp only and fills the PaymentStep slot with its own page', () => {
  const part = descriptor.mockPsp()
  assert.equal(part.id, 'mock')
  assert.deepEqual(Object.keys(part.ports), ['psp'])
  assert.equal(part.ports.psp().category, 'psp')
  assert.deepEqual(part.storefront.slots, {
    psp: { PaymentStep: '@integrations/mock-psp/page#PaymentDemo' },
  })
})

test('the port factory returns the payment service under the port key', () => {
  const paymentService = {}
  assert.equal(
    payment.default.useFactory(paymentService).paymentService,
    paymentService
  )
})

test('offers invoice (the default) and prepayment as valid payment methods', async () => {
  const { paymentMethods } = await new PaymentService(
    context()
  ).getPaymentMethods()
  PaymentMethodsResponseSchema.parse({ paymentMethods })
  assert.deepEqual(
    paymentMethods.map((m) => [m.id, m.isDefault]),
    [
      ['invoice', true],
      ['prepayment', false],
    ]
  )
})

test("links to the storefront's payment step for the cart", async () => {
  const { paymentLink } = await new PaymentService(
    context('https://shop.example')
  ).getPaymentLink('cart-1')
  assert.equal(paymentLink, `https://shop.example${PAYMENT_STEP_PATH}/cart-1`)
})

test('the payment result: every status as the page reports it; anything else (no result, a typo) is failed, never paid', async () => {
  const service = new PaymentService(context())
  const result = (params) =>
    service.getPaymentResult({ paymentId: 'cart-1', params })
  assert.deepEqual(await result({ result: 'paid' }), {
    status: 'paid',
    cartId: 'cart-1',
  })
  assert.deepEqual(await result({ result: 'authorized' }), {
    status: 'authorized',
    cartId: 'cart-1',
  })
  assert.deepEqual(await result({ result: 'pending' }), {
    status: 'pending',
    cartId: 'cart-1',
  })
  assert.deepEqual(await result({ result: 'cancelled' }), {
    status: 'cancelled',
    cartId: 'cart-1',
  })
  assert.deepEqual(await result({ result: 'failed' }), {
    status: 'failed',
    cartId: 'cart-1',
  })
  assert.deepEqual(await result({}), { status: 'failed', cartId: 'cart-1' })
  assert.deepEqual(await result({ result: 'PAID' }), {
    status: 'failed',
    cartId: 'cart-1',
  })
})
