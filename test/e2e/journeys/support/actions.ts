import { expect, type Page, type Response } from '@playwright/test'
import {
  cartPage,
  checkout,
  header,
  miniCart,
  pdp,
  productList,
  searchPopup,
  toast,
} from './selectors'
import { ROUTES, TEST_DATA } from './test-data'

const cartItemsRequest = (method: string) => (r: Response) =>
  r.url().includes('/cart/items') && r.request().method() === method

/** Opens the test product from its category page. */
export async function openProductFromCategory(page: Page) {
  const { category, name } = TEST_DATA.product
  await page.goto(category)
  await productList.tile(page, name).click()
  await expect(page).toHaveURL(/\/p\/.+variantId=/)
  await expect(pdp.heading(page, name)).toBeVisible()
}

/** Adds the product open on the PDP and waits for the mini-cart. */
export async function addToCartFromPdp(page: Page) {
  const added = page.waitForResponse(cartItemsRequest('POST'))
  await pdp.addToBasket(page).click()
  expect((await added).ok()).toBe(true)
  await expect(miniCart.addedMessage(page)).toBeVisible()
}

/** Puts the test product in the cart and closes the mini-cart. */
export async function addTestProductToCart(page: Page) {
  await openProductFromCategory(page)
  await addToCartFromPdp(page)
  await miniCart.close(page).click()
  await expect(miniCart.dialog(page)).toBeHidden()
}

/** Saves the test product from its product page. */
export async function saveTestProductToWishlist(page: Page) {
  await openProductFromCategory(page)
  await pdp.saveToWishlist(page).click()
  await expect(toast.addedToWishlist(page)).toBeVisible()
}

export async function increaseCartQuantity(page: Page, to: number) {
  const updated = page.waitForResponse(cartItemsRequest('PUT'))
  await cartPage.increaseQuantity(page, to).click()
  expect((await updated).ok()).toBe(true)
}

export async function removeCartItem(page: Page) {
  await cartPage.removeItem(page).click()
  await cartPage.confirmRemoval(page).click()
}

export async function searchFromHeader(page: Page, term: string) {
  await page.goto(ROUTES.home)
  await header.searchButton(page).click()
  await searchPopup.input(page).fill(term)
  await searchPopup.input(page).press('Enter')
}

export async function startGuestCheckout(page: Page) {
  await page.goto(ROUTES.cart)
  await cartPage.checkout(page).click()
  await checkout.orderAsGuest(page).click()
  await expect(page).toHaveURL(/\/checkout\/billing/)
}

export async function fillBillingAddress(page: Page, email: string) {
  const { address } = TEST_DATA
  await checkout.field(page, 'firstName').fill(address.firstName)
  await checkout.field(page, 'lastName').fill(address.lastName)
  await checkout.field(page, 'streetName').fill(address.streetName)
  await checkout.field(page, 'streetNumber').fill(address.streetNumber)
  await checkout.field(page, 'postalCode').fill(address.postalCode)
  await checkout.field(page, 'city').fill(address.city)
  await checkout.field(page, 'email').fill(email)
  await checkout.countrySelect(page).click()
  await checkout.countryOption(page, address.countryCode).click()
}

/** Drives guest checkout from the cart up to the review step. */
export async function checkoutAsGuestToReview(page: Page, email: string) {
  await startGuestCheckout(page)

  await fillBillingAddress(page, email)
  await checkout.continueToShipping(page).click()

  await expect(page).toHaveURL(/\/checkout\/shipping/)
  await expect(checkout.sameAsBilling(page)).toBeChecked()
  await checkout.continueToDeliveryMethod(page).click()

  await expect(page).toHaveURL(/\/checkout\/delivery-method/)
  await expect(checkout.deliveryMethods(page)).toBeVisible()
  await checkout.continueToPayment(page).click()

  await expect(page).toHaveURL(/\/checkout\/payment/)
  await checkout.paymentMethod(page, TEST_DATA.paymentMethod).check()
  await checkout.continueToReview(page).click()

  await expect(page).toHaveURL(/\/checkout\/review/)
}

/** Accepts the terms and continues to the demo payment provider. */
export async function acceptTermsAndBuy(page: Page) {
  await checkout.acceptTerms(page).check()
  await checkout.buyNow(page).click()
  await expect(page).toHaveURL(/\/demo\/mocked-payment-step\//)
}
