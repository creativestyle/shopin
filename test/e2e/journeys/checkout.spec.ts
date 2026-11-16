import { test, expect } from '@playwright/test'
import { uniqueEmail } from './support/catalog'
import {
  acceptTermsAndBuy,
  addFirstProductToCart,
  checkoutAsGuestToReview,
} from './support/actions'

test.describe('Guest checkout', () => {
  test('empty cart cannot enter checkout', async ({ page }) => {
    await page.goto('/checkout/billing')

    await expect(page).toHaveURL(/\/cart$/)
  })

  test('review step requires accepting the terms', async ({ page }) => {
    await addFirstProductToCart(page)
    await checkoutAsGuestToReview(page, uniqueEmail())

    await page.getByRole('button', { name: 'Buy Now' }).click()

    await expect(
      page.getByText('Please accept the Terms and Conditions to continue.')
    ).toBeVisible()
    await expect(page).toHaveURL(/\/checkout\/review/)
  })
})

// Relies on the demo mocked payment provider; drop when a real PSP replaces it.
test.describe(
  'Guest checkout with mocked payment',
  { tag: '@mock-payment' },
  () => {
    test('places an order', async ({ page }) => {
      const email = uniqueEmail()
      await addFirstProductToCart(page)
      await checkoutAsGuestToReview(page, email)
      await acceptTermsAndBuy(page)

      await page.getByRole('button', { name: 'Pay Now' }).click()

      await expect(page).toHaveURL(/\/checkout\/complete\?orderId=/, {
        timeout: 30_000,
      })
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'Thank you for your order',
        })
      ).toBeVisible()
      await expect(
        page.getByText(/Order No\. \S+ has been placed/)
      ).toContainText(email)
    })

    test('failed payment returns to the review step', async ({ page }) => {
      await addFirstProductToCart(page)
      await checkoutAsGuestToReview(page, uniqueEmail())
      await acceptTermsAndBuy(page)

      await page
        .getByRole('button', { name: 'Simulate Failed Payment' })
        .click()

      await expect(page).toHaveURL(/\/checkout\/review/)
      await expect(
        page.getByText('Payment failed. Please try again.')
      ).toBeVisible()
      await expect(page.getByRole('button', { name: 'Buy Now' })).toBeVisible()
    })
  }
)
