/**
 * Checkout preparation for tests that start inside checkout: a product put in
 * the cart from its page, every earlier step filled through the BFF.
 */

import { expect, type Page } from '@playwright/test'
import { bffApi } from './bff-api'
import { DATA_SOURCE } from './fixtures'
import { findProductUrl, openRoute, productPage } from './pages'
import { TEST_DATA, uniqueEmail } from './test-data'

/** Adds a product of the test-data category from its product page. */
export async function addProductToCart(page: Page) {
  await openRoute(page, await findProductUrl(page))
  const added = page.waitForResponse(
    (res) =>
      res.url().includes('/cart/items') && res.request().method() === 'POST'
  )
  await productPage.addToBasket(page).click()
  expect((await added).ok(), 'add to cart').toBe(true)
}

/** A cart with a product and every checkout step completed, ready for review. */
export async function prepareCheckout(page: Page) {
  await addProductToCart(page)
  const api = bffApi(page.context().request, DATA_SOURCE)
  const { countryCode, ...address } = TEST_DATA.address
  const fullAddress = {
    ...address,
    country: countryCode,
    email: uniqueEmail('checkout'),
  }
  await api.put('cart/billing-address', fullAddress)
  await api.put('cart/shipping-address', fullAddress)

  const { shippingMethods } = await api.get<{
    shippingMethods: { id: string; isDefault?: boolean }[]
  }>('cart/shipping-methods')
  const shipping =
    shippingMethods.find((method) => method.isDefault) ?? shippingMethods[0]
  await api.put('cart/shipping-method', { shippingMethodId: shipping.id })

  const { paymentMethods } = await api.get<{
    paymentMethods: {
      id: string
      name: string
      paymentInterface: string
      isDefault?: boolean
    }[]
  }>('payment/methods')
  const payment =
    paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0]
  await api.put('payment/method', {
    paymentMethodId: payment.id,
    paymentInterface: payment.paymentInterface,
    paymentMethodName: payment.name,
  })
}
