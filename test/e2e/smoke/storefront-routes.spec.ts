/**
 * One check per route group of the storefront: the route answers without an
 * error and renders what only that route renders. A removed or broken route
 * fails here first, even where the CMS catch-all would answer its path.
 */

import { expect, test } from '../journeys/support/fixtures'
import {
  atPath,
  authPages,
  cartPage,
  categoryPage,
  findProductUrl,
  layout,
  mockedPaymentPage,
  openRoute,
  productPage,
  searchPage,
  wishlistPage,
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

    await expect(categoryPage.sortBy(page)).toBeVisible()
  })

  test('product page', { tag: TAGS }, async ({ page }) => {
    const productUrl = await findProductUrl(page)

    await openRoute(page, productUrl)

    await expect(productPage.buyBox(page)).toBeVisible()
  })

  test('search results', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.search(TEST_DATA.searchTerm))

    await expect(searchPage.heading(page)).toBeVisible()
  })

  test('cart', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.cart)

    await expect(cartPage.heading(page, 0)).toBeVisible()
  })

  test('wishlist', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.wishlist)

    await expect(wishlistPage.heading(page)).toBeVisible()
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

    await expect(authPages.signInButton(page)).toBeVisible()
  })

  test('sign-up', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.signUp)

    await expect(authPages.signUpButton(page)).toBeVisible()
  })

  test('forgot password', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.forgotPassword)

    await expect(authPages.sendResetLinkButton(page)).toBeVisible()
  })

  test('demo payment provider page', { tag: TAGS }, async ({ page }) => {
    await openRoute(page, ROUTES.mockedPaymentStep('e2e-smoke'))

    await expect(mockedPaymentPage.payNow(page)).toBeVisible()
  })
})
