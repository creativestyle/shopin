/**
 * Named locators and page steps shared by journey and smoke specs.
 * Visible text comes from core/i18n through t(), so specs run in any locale.
 */

import { expect, type APIRequestContext, type Page } from '@playwright/test'
import { STOREFRONT_URL } from '../../config'
import { escapeRegExp, t, tPattern } from './i18n'
import { ROUTES } from './test-data'

export const layout = {
  header: (page: Page) => page.getByRole('banner'),
  main: (page: Page) => page.getByRole('main'),
  /** Every level-1 heading: CMS pages can hold more than one. */
  pageHeadings: (page: Page) => page.getByRole('heading', { level: 1 }),
}

export const productList = {
  tiles: (page: Page) =>
    layout
      .main(page)
      .getByRole('link', { name: tPattern('productCard.linkAriaLabel') }),
}

const startsWith = (text: string) => new RegExp(`^${escapeRegExp(text)}`)
const h1 = (page: Page, name: string | RegExp) =>
  page.getByRole('heading', { level: 1, name })

// What only each route renders: the CMS catch-all would answer a removed route
// with a generic page, so a route check looks for these, not just any page

export const categoryPage = {
  sortBy: (page: Page) =>
    page.getByRole('combobox', { name: t('productCollection.topbar.sortBy') }),
}

export const productPage = {
  buyBox: (page: Page) =>
    page.getByRole('complementary').filter({
      has: page.getByRole('button', { name: t('product.buyBox.addToBasket') }),
    }),
  addToBasket: (page: Page) =>
    productPage
      .buyBox(page)
      .getByRole('button', { name: t('product.buyBox.addToBasket') }),
}

export const searchPage = {
  heading: (page: Page) => h1(page, startsWith(t('searchResults.titlePrefix'))),
}

export const cartPage = {
  heading: (page: Page, count: number) =>
    h1(page, t('cart.titleWithCount', { count })),
}

export const wishlistPage = {
  heading: (page: Page) => h1(page, startsWith(t('wishlist.title'))),
}

export const authPages = {
  signInButton: (page: Page) =>
    page.getByRole('button', {
      name: t('account.signIn.signInButton'),
      exact: true,
    }),
  signUpButton: (page: Page) =>
    page.getByRole('button', { name: t('account.signUp.submitButton') }),
  sendResetLinkButton: (page: Page) =>
    page.getByRole('button', {
      name: t('account.forgotPassword.submitButton'),
    }),
}

export const accountPages = {
  overviewHeading: (page: Page) =>
    h1(page, tPattern('account.myAccount.overviewWelcomeMessage')),
  ordersHeading: (page: Page) => h1(page, t('account.myAccount.ordersLabel')),
  myDataHeading: (page: Page) => h1(page, t('account.myAccount.myDataLabel')),
  /** The selected tab of My Data: personalDataLabel, addressesLabel or changePasswordLabel. */
  myDataTab: (page: Page, labelKey: string) =>
    page.getByRole('tab', {
      name: t(`account.myAccount.${labelKey}`),
      selected: true,
    }),
}

export const checkoutPages = {
  /** The active step, a region named after the step. */
  activeStep: (page: Page, step: string) =>
    page.getByRole('region', { name: t(`checkout.steps.${step}.title`) }),
  paymentCallbackHeading: (page: Page) =>
    h1(page, t('checkout.paymentProcessing')),
}

export const orderDetailPage = {
  heading: (page: Page) => h1(page, t('account.myAccount.orderDetailLabel')),
}

export const authSubpages = {
  resetPasswordTokenRequired: (page: Page) =>
    page.getByText(t('account.resetPassword.errors.tokenRequired')),
  forgotPasswordSuccess: (page: Page) =>
    page.getByText(t('account.forgotPassword.successTitle')),
  verifyEmailTokenRequired: (page: Page) =>
    page.getByText(t('account.registrationSuccess.errors.tokenRequired')),
}

// The demo payment provider page is not translated
export const mockedPaymentPage = {
  payNow: (page: Page) => page.getByRole('button', { name: 'Pay Now' }),
}

/** Matches the page URL once it is at this storefront path (query string allowed). */
export const atPath = (path: string) =>
  new RegExp(`${escapeRegExp(path)}(\\?.*)?$`)

/**
 * Opens a route and checks the storefront answered it, rather than a 404 or an
 * error page. A page without a level-1 heading passes `{ heading: false }`.
 */
export async function openRoute(
  page: Page,
  path: string,
  { heading = true }: { heading?: boolean } = {}
) {
  const response = await page.goto(path)
  expect(response?.status(), `status of ${path}`).toBeLessThan(400)
  if (heading) {
    await expect(layout.pageHeadings(page)).not.toHaveCount(0)
  }
}

/** Opens the test-data category and returns the URL of a product it lists. */
export async function findProductUrl(page: Page): Promise<string> {
  await openRoute(page, ROUTES.category)
  const tiles = productList.tiles(page)
  await expect(tiles).not.toHaveCount(0)
  // Test data, not a locator: any product the category lists will do, so read
  // every tile's link and take one instead of pointing at a tile by position
  const [href] = await tiles.evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? '')
  )
  expect(href, 'product tile link').toMatch(/\/p\/.+variantId=/)
  return href
}

/** Expires the journey storefront's Data Cache, so its next render fetches from the BFF. */
export async function expireStorefrontCache(request: APIRequestContext) {
  const res = await request.get(`${STOREFRONT_URL}/api/e2e/revalidate`)
  expect(res.ok(), 'storefront cache revalidation').toBe(true)
}

/** Status of a storefront page fetched without a browser (only its server talks to the BFF). */
export async function storefrontStatus(
  request: APIRequestContext,
  path: string
) {
  return (await request.get(`${STOREFRONT_URL}${path}`)).status()
}
