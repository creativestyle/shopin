import { expect, type Page } from '@playwright/test'
import { CATEGORY_WITH_SINGLE_VARIANT_PRODUCTS, GUEST_ADDRESS } from './catalog'

const PRODUCT_LINK_PREFIX = 'View details for '

export function buyBox(page: Page) {
  return page.getByRole('complementary').filter({
    has: page.getByRole('button', { name: 'Add to Basket' }),
  })
}

export function headerCartLink(page: Page) {
  return page.getByRole('banner').getByRole('link', { name: /^Cart/ })
}

/** Opens the first product of a category and returns its name. */
export async function openFirstProduct(
  page: Page,
  categoryPath = CATEGORY_WITH_SINGLE_VARIANT_PRODUCTS
) {
  await page.goto(categoryPath)
  const tile = page
    .getByRole('link', { name: new RegExp(`^${PRODUCT_LINK_PREFIX}`) })
    .first()
  const label = await tile.getAttribute('aria-label')
  const name = label!.slice(PRODUCT_LINK_PREFIX.length)

  await tile.click()
  await expect(page).toHaveURL(/\/p\/.+variantId=/)
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  return name
}

/** Adds the product open on the PDP and returns the mini-cart sheet. */
export async function addToCartFromPdp(page: Page) {
  const added = page.waitForResponse(
    (r) => r.url().includes('/cart/items') && r.request().method() === 'POST'
  )
  await buyBox(page).getByRole('button', { name: 'Add to Basket' }).click()
  expect((await added).ok()).toBe(true)

  const miniCart = page.getByRole('dialog', { name: /^Cart \(\d+\)/ })
  await expect(
    miniCart.getByText('Good choice. Item has been added to cart.')
  ).toBeVisible()
  return miniCart
}

/** Puts one product in the cart and returns its name. */
export async function addFirstProductToCart(page: Page) {
  const name = await openFirstProduct(page)
  const miniCart = await addToCartFromPdp(page)
  await miniCart.getByRole('button', { name: 'Close' }).click()
  return name
}

export async function startGuestCheckout(page: Page) {
  await page.goto('/cart')
  await page.getByRole('link', { name: 'Checkout', exact: true }).click()
  await page.getByRole('button', { name: 'Order as Guest' }).click()
  await expect(page).toHaveURL(/\/checkout\/billing/)
}

export async function fillBillingAddress(page: Page, email: string) {
  const form = page.locator('#billing-address-form')
  await form.getByLabel('First Name').fill(GUEST_ADDRESS.firstName)
  await form.getByLabel('Last Name').fill(GUEST_ADDRESS.lastName)
  await form.getByLabel('Street Name').fill(GUEST_ADDRESS.streetName)
  await form.getByLabel('Street Number').fill(GUEST_ADDRESS.streetNumber)
  await form.getByLabel('Postal Code').fill(GUEST_ADDRESS.postalCode)
  await form.getByLabel('City').fill(GUEST_ADDRESS.city)
  await form.getByLabel('Email').fill(email)
  await form.getByRole('combobox', { name: 'Country' }).click()
  await page.getByRole('option', { name: GUEST_ADDRESS.country }).click()
}

/** Drives guest checkout from the cart up to the review step. */
export async function checkoutAsGuestToReview(page: Page, email: string) {
  await startGuestCheckout(page)

  await fillBillingAddress(page, email)
  await page
    .getByRole('button', { name: 'Continue to Shipping Address' })
    .click()

  await expect(page).toHaveURL(/\/checkout\/shipping/)
  await expect(
    page.getByRole('checkbox', {
      name: 'The delivery address matches the billing address',
    })
  ).toBeChecked()
  await page
    .getByRole('button', { name: 'Continue to Delivery Method' })
    .click()

  await expect(page).toHaveURL(/\/checkout\/delivery-method/)
  await expect(page.getByRole('radio').first()).toBeVisible()
  await page.getByRole('button', { name: 'Continue to Payment Method' }).click()

  await expect(page).toHaveURL(/\/checkout\/payment/)
  await page.getByRole('radio', { name: /^Invoice/ }).check()
  await page.getByRole('button', { name: 'Continue to Review Order' }).click()

  await expect(page).toHaveURL(/\/checkout\/review/)
}

export async function acceptTermsAndBuy(page: Page) {
  await page.getByRole('checkbox', { name: /accept/i }).check()
  await page.getByRole('button', { name: 'Buy Now' }).click()
  await expect(page).toHaveURL(/\/demo\/mocked-payment-step\//)
}
