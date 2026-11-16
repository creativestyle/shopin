import { test, expect } from '@playwright/test'
import {
  acceptTermsAndBuy,
  addTestProductToCart,
  checkoutAsGuestToReview,
} from './support/actions'
import { checkout, mockedPayment, orderComplete } from './support/selectors'
import { ROUTES, uniqueEmail } from './support/test-data'

test.describe('Guest checkout', { tag: '@checkout' }, () => {
  test(
    'Empty cart cannot enter checkout',
    { tag: ['@desktop', '@priority-medium', '@unverified'] },
    async ({ page }) => {
      await page.goto(ROUTES.checkoutBilling)

      await expect(page).toHaveURL(ROUTES.cart)
    }
  )

  test(
    'Review step requires accepting the terms',
    { tag: ['@desktop', '@priority-high', '@unverified'] },
    async ({ page }) => {
      await addTestProductToCart(page)
      await checkoutAsGuestToReview(page, uniqueEmail())

      await checkout.buyNow(page).click()

      await expect(checkout.termsRequired(page)).toBeVisible()
      await expect(page).toHaveURL(/\/checkout\/review/)
    }
  )
})

// Relies on the demo mocked payment provider; drop when a real PSP replaces it.
test.describe(
  'Guest checkout with mocked payment',
  { tag: ['@checkout', '@mock-payment'] },
  () => {
    test(
      'Guest places an order',
      { tag: ['@desktop', '@priority-critical', '@unverified'] },
      async ({ page }) => {
        const email = uniqueEmail()
        await addTestProductToCart(page)
        await checkoutAsGuestToReview(page, email)
        await acceptTermsAndBuy(page)

        await mockedPayment.payNow(page).click()

        await expect(page).toHaveURL(/\/checkout\/complete\?orderId=/)
        await expect(orderComplete.heading(page)).toBeVisible()
        await expect(orderComplete.confirmation(page, email)).toBeVisible()
      }
    )

    test(
      'Failed payment returns to the review step',
      { tag: ['@desktop', '@priority-high', '@unverified'] },
      async ({ page }) => {
        await addTestProductToCart(page)
        await checkoutAsGuestToReview(page, uniqueEmail())
        await acceptTermsAndBuy(page)

        await mockedPayment.simulateFailure(page).click()

        await expect(page).toHaveURL(/\/checkout\/review/)
        await expect(checkout.paymentFailed(page)).toBeVisible()
        await expect(checkout.buyNow(page)).toBeVisible()
      }
    )
  }
)
