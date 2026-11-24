/**
 * One check per route group of the storefront: the route answers without an
 * error and renders its page. A removed or broken route fails here first.
 */

import { expect, test } from '../journeys/support/fixtures'
import {
  atPath,
  findProductUrl,
  layout,
  openRoute,
} from '../journeys/support/pages'
import { ROUTES, TEST_DATA } from '../journeys/support/test-data'

const TAGS = ['@desktop', '@mobile', '@priority-high', '@unverified']

test.describe('Storefront routes', { tag: '@smoke' }, () => {
  test('home', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.home)

    await expect(layout.header(page)).toBeVisible()
  })

  test('CMS page', { tag: TAGS }, async ({ page }) => {
    test.skip(!ROUTES.cmsPage, 'the test data names no CMS page')

    await openRoute(page, ROUTES.cmsPage!)
  })

  test('category page lists products', { tag: TAGS }, async ({ page }) => {
    await findProductUrl(page)
  })

  test('product page', { tag: TAGS }, async ({ page }) => {
    const productUrl = await findProductUrl(page)

    await openRoute(page, productUrl)
  })

  test('search results', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.search(TEST_DATA.searchTerm))
  })

  test('cart', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.cart)
  })

  test('wishlist', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.wishlist)
  })

  test(
    'checkout sends an empty cart back to the cart',
    { tag: TAGS },
    async ({ page }) => {
      await page.goto(ROUTES.checkout)

      await expect(page).toHaveURL(atPath(ROUTES.cart))
    }
  )

  test('sign-in', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.signIn)
  })

  test('sign-up', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.signUp)
  })

  test('forgot password', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.forgotPassword)
  })

  test('demo payment provider page', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.mockedPaymentStep('e2e-smoke'))
  })
})
